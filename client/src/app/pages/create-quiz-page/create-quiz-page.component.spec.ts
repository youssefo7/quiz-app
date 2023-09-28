import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizGeneralInfoComponent } from '@app/components/quiz-general-info/quiz-general-info.component';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { CreateQuizPageComponent } from './create-quiz-page.component';

describe('CreateQuizPageComponent', () => {
    let component: CreateQuizPageComponent;
    let fixture: ComponentFixture<CreateQuizPageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CreateQuizPageComponent, QuizGeneralInfoComponent, QuizQuestionInfoComponent],
        });
        fixture = TestBed.createComponent(CreateQuizPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
