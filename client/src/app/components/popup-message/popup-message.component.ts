import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';

@Component({
    selector: 'app-popup-message',
    templateUrl: './popup-message.component.html',
    styleUrls: ['./popup-message.component.scss'],
})
export class PopupMessageComponent {
    config: PopupMessageConfig;

    constructor(private popupRef: MatDialogRef<PopupMessageComponent>) {}

    /*
    To give your config object to this component, take your dialog ref when
    you open it and directly affect your config object by accessing this attribute
    ex. const dialogRef = this.dialog.open(PopupMessageComponent, MatDialogConfig);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = yourConfig;
    */

    okFunctionWrapper() {
        this.config.okButtonFunction?.();
        this.popupRef.close();
    }

    cancelFunctionWrapper() {
        this.config.cancelButtonFunction?.();
        this.popupRef.close();
    }
}
