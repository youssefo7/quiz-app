import { Component, HostListener } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AdminGuardService } from '@app/services/admin-guard.service';

@Component({
    selector: 'app-admin-popup',
    templateUrl: './admin-popup.component.html',
    styleUrls: ['./admin-popup.component.scss'],
})
export class AdminPopupComponent {
    givenPassword: string;
    canShowErrorMessage: boolean;
    passwordInputType: string;
    private isGivenPasswordValid: boolean;

    constructor(
        private adminPopupRef: MatDialogRef<AdminPopupComponent>,
        private router: Router,
        private adminGuard: AdminGuardService,
    ) {
        this.givenPassword = '';
        this.isGivenPasswordValid = false;
        this.canShowErrorMessage = false;
        this.passwordInputType = 'password';
    }

    @HostListener('keyup', ['$event'])
    async submitPasswordOnEnter(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            await this.verifyAccess();
        }
    }

    closeAdminPopup() {
        this.adminPopupRef.close();
    }

    togglePasswordVisibility() {
        this.passwordInputType = this.passwordInputType === 'password' ? 'text' : 'password';
    }

    async submitPassword($event: MouseEvent) {
        $event.preventDefault();
        await this.verifyAccess();
    }

    private async verifyAccess() {
        this.isGivenPasswordValid = await this.adminGuard.isAccessGranted(this.givenPassword);

        if (!this.isGivenPasswordValid) {
            this.givenPassword = '';
            this.canShowErrorMessage = true;
        } else {
            this.closeAdminPopup();
            await this.router.navigateByUrl('/admin');
        }
    }
}
