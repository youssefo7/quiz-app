import { Component } from '@angular/core';
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
    isGivenPasswordValid: boolean;
    showErrorMessage: boolean;
    passwordInputType: string;

    constructor(
        private adminPopupRef: MatDialogRef<AdminPopupComponent>,
        private router: Router,
        private adminGuard: AdminGuardService,
    ) {
        this.givenPassword = '';
        this.isGivenPasswordValid = false;
        this.showErrorMessage = false;
        this.passwordInputType = 'password';
    }

    closeAdminPopup() {
        this.adminPopupRef.close();
    }

    togglePasswordVisibility() {
        if (this.passwordInputType === 'password') {
            this.passwordInputType = 'text';
        } else {
            this.passwordInputType = 'password';
        }
    }

    async submitPassword($event: MouseEvent) {
        $event.preventDefault();

        this.isGivenPasswordValid = this.adminGuard.isAccessGranted(this.givenPassword);

        if (!this.isGivenPasswordValid) {
            this.givenPassword = '';
            this.showErrorMessage = true;
        } else {
            this.closeAdminPopup();
            await this.router.navigateByUrl('/admin');
        }
    }
}
