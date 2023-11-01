import { Component, HostListener } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SocketClientService } from '@app/services/socket-client.service';

const CODE_LENGTH = 4;

enum RoomState {
    OK = 'OK',
    Invalid = 'INVALID',
    IsLocked = 'IS_LOCKED',
}

interface JoinRoomResponse {
    roomState: RoomState;
    quizId: string | null;
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

    constructor(
        private joinGamePopupRef: MatDialogRef<JoinGamePopupComponent>,
        private router: Router,
        private socketClientService: SocketClientService,
    ) {
        this.givenRoomCode = '';
        this.quizId = '';
        this.givenUsername = '';
        this.showUsernameField = false;
        this.isCodeValidated = false;
    }

    @HostListener('keyup', ['$event'])
    handleEnterPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            if (!this.isCodeValidated) {
                this.checkCode();
            } else if (this.showUsernameField) {
                this.verifyAndAccess();
            }
        }
    }

    isUsernameValid() {
        const trimmedUsername = this.givenUsername.trim();
        if (trimmedUsername.length === 0) {
            this.nameErrorMessage = 'Veuillez entrer un nom d’utilisateur valide.';
        } else {
            this.socketClientService.send('chooseName', { name: trimmedUsername, roomId: this.givenRoomCode }, (isNameValid: boolean) => {
                if (!isNameValid) {
                    this.nameErrorMessage = `Le nom ${trimmedUsername} n'est pas autorisé ou déjà pris!`;
                } else {
                    this.nameErrorMessage = '';
                }
            });
        }
        console.log('checking name');
        return this.nameErrorMessage === '';
    }

    checkCode() {
        if (this.givenRoomCode.length === CODE_LENGTH) {
            this.socketClientService.send('joinRoom', this.givenRoomCode, (response: JoinRoomResponse) => {
                switch (response.roomState) {
                    case RoomState.OK: {
                        this.showUsernameField = true;
                        this.isCodeValidated = true;
                        this.roomCodeErrorMessage = '';
                        if (response.quizId) {
                            this.quizId = response.quizId;
                        }
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
            });
        } else {
            this.roomCodeErrorMessage = 'Code à 4 chiffres requis.';
            this.showUsernameField = false;
        }
    }

    verifyAndAccess() {
        const isUsernameValid = this.isUsernameValid();
        if (isUsernameValid) {
            console.log('sending successful join');
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
