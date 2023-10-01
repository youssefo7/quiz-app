import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ErrorDialogData } from '@app/interfaces/error-dialog-data';

@Component({
    selector: 'app-import-popup',
    templateUrl: './import-popup.component.html',
    styleUrls: ['./import-popup.component.scss'],
})
export class ImportPopupComponent {
    errorMessages: string[];

    constructor(
        private dialogRef: MatDialogRef<ImportPopupComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData,
    ) {
        this.errorMessages = data.errorMessage ? data.errorMessage.split('\n') : [];
    }

    closeDialog() {
        this.dialogRef.close();
    }
}
