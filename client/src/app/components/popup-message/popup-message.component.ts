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

    constructor(
        private popupRef: MatDialogRef<PopupMessageComponent>, // private changeDetectorRef: ChangeDetectorRef,
    ) {}

    okFunctionWrapper() {
        this.config.okButtonFunction?.();
        this.popupRef.close();
    }

    cancelFunctionWrapper() {
        this.config.cancelButtonFunction?.();
        this.popupRef.close();
    }

    /* changeDetection() {
        this.changeDetectorRef.detectChanges();
    } */
}
