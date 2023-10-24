import { Component, HostListener } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

const codeLength = 4;

@Component({
    selector: 'app-joindre-partie-popup',
    templateUrl: './joindre-partie-popup.component.html',
    styleUrls: ['./joindre-partie-popup.component.scss'],
})
export class JoindrePartiePopupComponent {
    givenCode: string;
    givenUsername: string;
    givenAccess: boolean = true;
    usedUsernames: string[] = ['John', 'Doe'];
    errorMessage: string;
    codeErrorMessage: string;
    showUsernameField: boolean;
    isCodeValidated: boolean;

    constructor(
        private joindrePartiePopupRef: MatDialogRef<JoindrePartiePopupComponent>,
        private router: Router,
    ) {
        this.givenCode = '';
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
        const usedNames = this.usedUsernames.map((name) => name.toLowerCase());
        const lowerCaseInput = this.givenUsername.toLowerCase();

        if (usedNames.includes(lowerCaseInput)) {
            this.errorMessage = 'Ce nom de joueur est déjà pris!';
            this.givenAccess = false;
        } else if (lowerCaseInput === 'organisateur') {
            this.errorMessage = `Le nom ${this.givenUsername} n'est pas autorisé!`;
            this.givenAccess = false;
        } else if (lowerCaseInput === '') {
            this.errorMessage = 'Un nom de joueur est requis!';
            this.givenAccess = false;
        } else {
            this.errorMessage = '';
            this.givenAccess = true;
        }
    }

    checkCode(): void {
        if (this.givenCode.length === codeLength) {
            this.showUsernameField = true;
            this.isCodeValidated = true;
            this.codeErrorMessage = '';
        } else {
            this.codeErrorMessage = 'Code à 4 chiffres requis.';
            this.showUsernameField = false;
        }
    }

    verifyAndAccess(): void {
        this.checkUsername();

        if (this.givenAccess) {
            this.closeAdminPopup();
            console.log('accessed');
            this.router.navigateByUrl('/partie');
        }
    }

    closeAdminPopup(): void {
        this.joindrePartiePopupRef.close();
    }

    allowNumbersOnly(event: KeyboardEvent): void {
        const pattern = /[0-9]/;
        const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'];
        if (!pattern.test(event.key) && !allowedKeys.includes(event.key)) {
            event.preventDefault();
        }
    }
}
