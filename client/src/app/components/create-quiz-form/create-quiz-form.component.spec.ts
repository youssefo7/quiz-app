import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { QuizGeneralInfoComponent } from '@app/components/quiz-general-info/quiz-general-info.component';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { CreateQuizFormComponent } from './create-quiz-form.component';

describe('CreateQuizFormComponent', () => {
    let component: CreateQuizFormComponent;
    let fixture: ComponentFixture<CreateQuizFormComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CreateQuizFormComponent, QuizGeneralInfoComponent, QuizQuestionInfoComponent],
            imports: [HttpClientTestingModule, FormsModule, RouterTestingModule, MatDialogModule, ReactiveFormsModule],
        });
        fixture = TestBed.createComponent(CreateQuizFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
