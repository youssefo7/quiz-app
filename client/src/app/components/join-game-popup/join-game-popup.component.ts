import { Component, HostListener } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Constants } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { JoinEvents } from '@common/join.events';
import { firstValueFrom } from 'rxjs';

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
    async checkCode() {
        if (this.givenRoomCode.length === Constants.ROOM_CODE_LENGTH) {
            const joinRoomResponse = await firstValueFrom(
                this.roomCommunicationService.joinRoom(this.givenRoomCode, { socketId: this.socketClientService.socket.id }),
            );
            switch (joinRoomResponse.roomState) {
                case RoomState.OK: {
                    this.showUsernameField = true;
                    this.isCodeValidated = true;
                    this.roomCodeErrorMessage = '';
                    this.quizId = joinRoomResponse.quiz.id;
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
        const joinRoomResponse = await firstValueFrom(
            this.roomCommunicationService.joinRoom(this.givenRoomCode, { socketId: this.socketClientService.socket.id }),
        );
        if (joinRoomResponse.roomState !== RoomState.OK) {
            this.isCodeValidated = false;
            this.showUsernameField = false;
            this.roomCodeErrorMessage = 'La partie est verrouillée ou n’existe plus.';
            return;
        }
        const isUsernameValid = await this.isUsernameValid();
        if (isUsernameValid) {
            this.socketClientService.send(JoinEvents.JoinRoom, { roomId: this.givenRoomCode, name: this.givenUsername.trim() });
            this.socketClientService.send(JoinEvents.SuccessfulJoin, {
                roomId: this.givenRoomCode,
                name: this.givenUsername,
            });
            this.joinGamePopupRef.close();
            this.router.navigateByUrl(`/waiting/game/${this.quizId}/room/${this.givenRoomCode}`);
        }
    }

    closeAdminPopup() {
        this.joinGamePopupRef.close();
        this.socketClientService.send(GameEvents.PlayerLeaveGame, { roomId: this.givenRoomCode, isInGame: false });
    }

    allowNumbersOnly(event: KeyboardEvent) {
        const pattern = /[0-9]/;
        const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'];
        const allowedInput = pattern.test(event.key) || allowedKeys.includes(event.key);
        if (!allowedInput) {
            event.preventDefault();
        }
    }

    private async isUsernameValid(): Promise<boolean> {
        let isNameValid = false;
        const trimmedUsername = this.givenUsername.trim();
        if (!trimmedUsername) {
            this.nameErrorMessage = 'Veuillez entrer un nom d’utilisateur valide.';
        } else {
            isNameValid = await firstValueFrom(
                this.roomCommunicationService.processUsername(this.givenRoomCode, {
                    name: trimmedUsername,
                    socketId: this.socketClientService.socket.id,
                }),
            );
            if (!isNameValid) {
                this.nameErrorMessage = `Le nom ${this.givenUsername} n'est pas autorisé ou déjà pris!`;
            }
        }
        return isNameValid;
    }
}
