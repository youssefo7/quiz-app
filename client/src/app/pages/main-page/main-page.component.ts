import { Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AdminPopupComponent } from '@app/components/admin-popup/admin-popup.component';
import { JoindrePartiePopupComponent } from '@app/components/joindre-partie-popup/joindre-partie-popup.component';
import { AdminGuardService } from '@app/services/admin-guard.service';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss', '../../../assets/shared.scss'],
})
export class MainPageComponent {
    constructor(
        private adminPopup: MatDialog,
        private joindrePartiePopup: MatDialog,
        private adminGuardService: AdminGuardService,
    ) {
        this.initializeComponent();
    }

    initializeComponent(): void {
        if (this.adminGuardService.showAdminPopup()) {
            this.openAdminPopup();
        }
    }

    openAdminPopup() {
        const adminPopupConfig = new MatDialogConfig();
        adminPopupConfig.autoFocus = true;
        this.adminPopup.open(AdminPopupComponent, adminPopupConfig);
    }

    openJoindrePartiePopup() {
        const joindrePartiePopupConfig = new MatDialogConfig();
        joindrePartiePopupConfig.autoFocus = true;
        this.joindrePartiePopup.open(JoindrePartiePopupComponent, joindrePartiePopupConfig);
    }
}
