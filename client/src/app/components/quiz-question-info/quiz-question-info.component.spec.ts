import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { QuizQuestionInfoComponent } from './quiz-question-info.component';

describe('QuizQuestionInfoComponent', () => {
    let component: QuizQuestionInfoComponent;
    let fixture: ComponentFixture<QuizQuestionInfoComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuizQuestionInfoComponent],
            imports: [HttpClientTestingModule, MatDialogModule],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
        });
        fixture = TestBed.createComponent(QuizQuestionInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
