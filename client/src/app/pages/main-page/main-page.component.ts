import { Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AdminPopupComponent } from '@app/components/admin-popup/admin-popup.component';
import { JoinGamePopupComponent } from '@app/components/join-game-popup/join-game-popup.component';
import { AdminGuardService } from '@app/services/admin-guard.service';
import { SocketClientService } from '@app/services/socket-client.service';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss', '../../../assets/shared.scss'],
})
export class MainPageComponent {
    constructor(
        private adminPopup: MatDialog,
        private joinGamePopup: MatDialog,
        private adminGuardService: AdminGuardService,
        public socketClientService: SocketClientService,
    ) {
        this.initializeComponent();
        this.connect();
    }

    get socketId() {
        return this.socketClientService.socket.id ? this.socketClientService.socket.id : "";
      }

    connect() {
        if(!this.socketClientService.doesSocketExist()) {
            this.socketClientService.connect();
            this.configureSocketFeatures();
            console.log("Socket has been connected");
        }
    }

    initializeComponent(): void {
        if (this.adminGuardService.showAdminPopup()) {
            this.openAdminPopup();
        }
    }

    configureSocketFeatures() {
        this.socketClientService.on("connect", () => {
            console.log(`Connexion par WebSocket sur le socket ${this.socketId}`);
        });
    }

    openAdminPopup() {
        const adminPopupConfig = new MatDialogConfig();
        adminPopupConfig.autoFocus = true;
        this.adminPopup.open(AdminPopupComponent, adminPopupConfig);
    }

    openJoinGamePopup() {
        const joinGamePopupConfig = new MatDialogConfig();
        joinGamePopupConfig.autoFocus = true;
        this.joinGamePopup.open(JoinGamePopupComponent, joinGamePopupConfig);
    }
}
