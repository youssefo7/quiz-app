import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirmation-popup',
    templateUrl: './confirmation-popup.component.html',
    styleUrls: ['./confirmation-popup.component.scss'],
})
export class ConfirmationPopupComponent {
    private confirmationText: string;

    constructor(public confirmationDialogReference: MatDialogRef<ConfirmationPopupComponent>) {}

    confirm(): void {
        this.confirmationDialogReference.close(true);
    }

    cancel(): void {
        this.confirmationDialogReference.close(false);
    }

    setConfirmationText(text: string) {
        this.confirmationText = text;
    }

    getConfirmationText(): string {
        return this.confirmationText;
    }
}
