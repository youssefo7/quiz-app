import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogData } from '@app/interfaces/dialog-data';

@Component({
    selector: 'app-import-popup',
    templateUrl: './import-popup.component.html',
    styleUrls: ['./import-popup.component.scss'],
})
export class ImportPopupComponent {
    errorMessages: string[];

    constructor(
        private dialogRef: MatDialogRef<ImportPopupComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
    ) {
        // empty array if no error message
        this.errorMessages = data.errorMessage ? data.errorMessage.split('\n') : [];
    }

    closeDialog() {
        this.dialogRef.close();
    }

    // function to use in page
    // async handleImport(event: Event) {
    //     try {
    //         await this.importService.selectQuiz(event);
    //         await this.importService.importQuiz();
    //     } catch (error) {
    //         const errorMessage = error instanceof Error ? error.message : 'An error occurred.';
    //         this.dialog.open(ImportPopupComponent, {
    //             data: { errorMessage },
    //         });
    //         this.importService.resetInput(event);
    //     } finally {
    //         this.importService.resetInput(event);
    //     }
    // }

    // html to use in page
    // <input type="file" (change)="handleImport($event)" accept=".json"/>

    // in constructor in page
    // private dialog: MatDialog,
    // private importService: ImportService,
}
