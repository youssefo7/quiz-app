import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dialog } from '@angular/cdk/dialog';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { QuestionConfirmationComponent } from './question-confirmation.component';

describe('QuestionConfirmationComponent', () => {
    let component: QuestionConfirmationComponent;
    let fixture: ComponentFixture<QuestionConfirmationComponent>;
    let data: Dialog;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionConfirmationComponent],
            imports: [MatDialogModule],
            providers: [{ provide: MatDialogRef, useValue: {} }, { provide: MAT_DIALOG_DATA, useValue: data }],
        });
        fixture = TestBed.createComponent(QuestionConfirmationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
