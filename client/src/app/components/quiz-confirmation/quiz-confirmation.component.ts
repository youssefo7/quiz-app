import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-quiz-confirmation',
    templateUrl: './quiz-confirmation.component.html',
})
export class QuizConfirmationComponent {
    constructor(public confirmationDialogReference: MatDialogRef<QuizConfirmationComponent>) {}

    confirm(): void {
        this.confirmationDialogReference.close(true);
    }

    cancel(): void {
        this.confirmationDialogReference.close(false);
    }
}
