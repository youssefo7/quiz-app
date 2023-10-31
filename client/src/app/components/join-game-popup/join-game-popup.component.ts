import { Component, HostListener } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SocketClientService } from '@app/services/socket-client.service';

const codeLength = 4;

interface RoomJoinResponse {
    roomState: 'OK' | 'INVALID' | 'IS_LOCKED';
    quizId: string | null;
}

@Component({
    selector: 'app-join-game-popup',
    templateUrl: './join-game-popup.component.html',
    styleUrls: ['./join-game-popup.component.scss'],
})
export class JoinGamePopupComponent {
    givenCode: string;
    givenUsername: string;
    quizId: string;
    errorMessage: string;
    codeErrorMessage: string;
    showUsernameField: boolean;
    isCodeValidated: boolean;

    constructor(
        private joinGamePopupRef: MatDialogRef<JoinGamePopupComponent>,
        private router: Router,
        private socketClientService: SocketClientService,
    ) {
        this.givenCode = '';
        this.quizId = '';
        this.givenUsername = '';
        this.showUsernameField = false;
        this.isCodeValidated = false;
    }

    @HostListener('keyup', ['$event'])
    handleEnterPress(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            if (!this.isCodeValidated) {
                this.checkCode();
            } else if (this.showUsernameField) {
                this.verifyAndAccess();
            }
        }
    }

    checkUsername(): void {
        this.socketClientService.send('chooseName', this.givenUsername, (isNameValid: boolean) => {
            if (!isNameValid) {
                this.errorMessage = `Le nom ${this.givenUsername} n'est pas autorisé ou déjà pris!`;
            } else {
                this.errorMessage = '';
                this.verifyAndAccess();
            }
        });
    }

    checkCode(): void {
        if (this.givenCode.length === codeLength) {
            this.socketClientService.send('joinRoom', this.givenCode, (response: RoomJoinResponse) => {
                switch (response.roomState) {
                    case 'OK': {
                        this.showUsernameField = true;
                        this.isCodeValidated = true;
                        this.codeErrorMessage = '';
                        if (response.quizId) {
                            this.quizId = response.quizId;
                        }
                        break;
                    }
                    case 'IS_LOCKED': {
                        this.codeErrorMessage = 'La partie est verrouillée.';
                        this.showUsernameField = false;
                        break;
                    }
                    case 'INVALID': {
                        this.codeErrorMessage = 'Code invalide.';
                        this.showUsernameField = false;
                        break;
                    }
                    default: {
                        this.codeErrorMessage = 'Une erreur est survenue.';
                        this.showUsernameField = false;
                        break;
                    }
                }
            });
        } else {
            this.codeErrorMessage = 'Code à 4 chiffres requis.';
            this.showUsernameField = false;
        }
    }

    verifyAndAccess(): void {
        if (!this.errorMessage) {
            this.socketClientService.send('successfulJoin', {
                roomId: this.givenCode,
                name: this.givenUsername,
            });
            this.closeAdminPopup();
            this.router.navigateByUrl(`/waiting/game/${this.quizId}/room/${this.givenCode}`);
        }
    }

    closeAdminPopup(): void {
        this.joinGamePopupRef.close();
        this.socketClientService.disconnect();
    }

    allowNumbersOnly(event: KeyboardEvent): void {
        const pattern = /[0-9]/;
        const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'];
        if (!pattern.test(event.key) && !allowedKeys.includes(event.key)) {
            event.preventDefault();
        }
    }
}
