import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dialog } from '@angular/cdk/dialog';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { QuizConfirmationComponent } from './quiz-confirmation.component';

describe('QuizConfirmationComponent', () => {
    let component: QuizConfirmationComponent;
    let fixture: ComponentFixture<QuizConfirmationComponent>;
    let data: Dialog;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuizConfirmationComponent],
            imports: [MatDialogModule],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: data },
            ],
        });
        fixture = TestBed.createComponent(QuizConfirmationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
