import { Component, HostListener } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { firstValueFrom } from 'rxjs';

const CODE_LENGTH = 4;

enum RoomState {
    OK = 'OK',
    Invalid = 'INVALID',
    IsLocked = 'IS_LOCKED',
}

@Component({
    selector: 'app-join-game-popup',
    templateUrl: './join-game-popup.component.html',
    styleUrls: ['./join-game-popup.component.scss'],
})
export class JoinGamePopupComponent {
    givenRoomCode: string;
    givenUsername: string;
    nameErrorMessage: string;
    roomCodeErrorMessage: string;
    showUsernameField: boolean;
    isCodeValidated: boolean;
    private quizId: string;

    // Raison: J'injecte les services nécessaires dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private joinGamePopupRef: MatDialogRef<JoinGamePopupComponent>,
        private router: Router,
        private socketClientService: SocketClientService,
        private roomCommunicationService: RoomCommunicationService,
    ) {
        this.givenRoomCode = '';
        this.quizId = '';
        this.givenUsername = '';
        this.showUsernameField = false;
        this.isCodeValidated = false;
    }

    @HostListener('keyup', ['$event'])
    async handleEnterPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            if (!this.isCodeValidated) {
                await this.checkCode();
            } else if (this.showUsernameField) {
                this.verifyAndAccess();
            }
        }
    }

    async isUsernameValid(): Promise<boolean> {
        const trimmedUsername = this.givenUsername.trim();
        if (trimmedUsername.length === 0) {
            this.nameErrorMessage = 'Veuillez entrer un nom d’utilisateur valide.';
        } else {
            const isNameTaken = await firstValueFrom(
                this.roomCommunicationService.getNameValidity({
                    name: trimmedUsername,
                    roomId: this.givenRoomCode,
                    socketId: this.socketClientService.socket.id,
                }),
            );
            if (!isNameTaken) {
                this.nameErrorMessage = `Le nom ${this.givenUsername} n'est pas autorisé ou déjà pris!`;
            }
            return isNameTaken;
        }

        return this.nameErrorMessage === '';
    }

    async checkCode() {
        if (this.givenRoomCode.length === CODE_LENGTH) {
            const response = await firstValueFrom(
                this.roomCommunicationService.joinRoom({ roomId: this.givenRoomCode, socketId: this.socketClientService.socket.id }),
            );
            console.log(JSON.stringify(response));
            switch (response.roomState) {
                case RoomState.OK: {
                    console.log('RoomState.OK');
                    this.showUsernameField = true;
                    this.isCodeValidated = true;
                    this.roomCodeErrorMessage = '';
                    if (response.quizId) {
                        this.quizId = response.quizId;
                    }
                    console.log('Joining room', this.givenRoomCode);
                    this.socketClientService.send('joinRoom', this.givenRoomCode);
                    break;
                }
                case RoomState.IsLocked: {
                    this.roomCodeErrorMessage = 'La partie est verrouillée.';
                    this.showUsernameField = false;
                    break;
                }
                case RoomState.Invalid: {
                    this.roomCodeErrorMessage = 'Code invalide.';
                    this.showUsernameField = false;
                    break;
                }
                default: {
                    this.roomCodeErrorMessage = 'Une erreur est survenue.';
                    this.showUsernameField = false;
                    break;
                }
            }
        } else {
            this.roomCodeErrorMessage = 'Code à 4 chiffres requis.';
            this.showUsernameField = false;
        }
    }

    async verifyAndAccess() {
        const isUsernameValid = await this.isUsernameValid();
        if (isUsernameValid) {
            this.socketClientService.send('successfulJoin', {
                roomId: this.givenRoomCode,
                name: this.givenUsername,
            });
            this.joinGamePopupRef.close();
            this.router.navigateByUrl(`/waiting/game/${this.quizId}/room/${this.givenRoomCode}`);
        }
    }

    closeAdminPopup() {
        this.joinGamePopupRef.close();
        this.socketClientService.send('playerLeaveGame', { roomId: this.givenRoomCode, isInGame: false });
    }

    allowNumbersOnly(event: KeyboardEvent) {
        const pattern = /[0-9]/;
        const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'];
        if (!pattern.test(event.key) && !allowedKeys.includes(event.key)) {
            event.preventDefault();
        }
    }
}
