import { Dialog } from '@angular/cdk/dialog';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-question-confirmation',
    templateUrl: './question-confirmation.component.html',
})
export class QuestionConfirmationComponent {
    constructor(public confirmationDialogReference: MatDialogRef<QuestionConfirmationComponent>, @Inject(MAT_DIALOG_DATA) public data: Dialog | any) {}

    onConfirm(): void {
        this.confirmationDialogReference.close(true);
    }

    onCancel(): void {
        this.confirmationDialogReference.close(false);
    }
}
