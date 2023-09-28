import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-pop-up',
  templateUrl: './confirmation-pop-up.component.html',
  styleUrls: ['./confirmation-pop-up.component.scss'],
})
export class ConfirmationPopUpComponent {
  private confirmationText: string;

  constructor(public confirmationDialogReference: MatDialogRef<ConfirmationPopUpComponent>) {}

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
