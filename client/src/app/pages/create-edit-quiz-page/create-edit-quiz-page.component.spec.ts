import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { QuizGeneralInfoComponent } from '@app/components/quiz-general-info/quiz-general-info.component';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { Question, Quiz } from '@app/interfaces/quiz';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { CreateEditQuizPageComponent } from './create-edit-quiz-page.component';
import SpyObj = jasmine.SpyObj;

describe('CreateEditQuizPageComponent', () => {
    let component: CreateEditQuizPageComponent;
    let fixture: ComponentFixture<CreateEditQuizPageComponent>;
    let matDialogSpy: SpyObj<MatDialog>;
    let quizManagerServiceSpy: SpyObj<QuizManagerService>;
    let activatedRouteSpy: SpyObj<ActivatedRoute>;
    let quizQuestionInfoSpy: QuizQuestionInfoComponent;
    let mockQuiz: Quiz;

    beforeEach(() => {
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        quizManagerServiceSpy = jasmine.createSpyObj('NewQuizManagerService', [
            'fetchQuiz',
            'deleteQuestion',
            'moveQuestionUp',
            'moveQuestionDown',
            'saveQuiz',
        ]);
        // activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', []);
        quizQuestionInfoSpy = jasmine.createSpyObj('QuizQuestionInfoComponent', ['loadQuestionInformation']);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [CreateEditQuizPageComponent, QuizGeneralInfoComponent, TopBarComponent],
            imports: [HttpClientTestingModule],
            providers: [
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: QuizManagerService, useValue: quizManagerServiceSpy },
                { provide: QuizQuestionInfoComponent, useValue: quizQuestionInfoSpy },
            ],
        });
    }));

    beforeEach(() => {
        mockQuiz = {
            questions: [
                {
                    type: 'QCM',
                    text: 'TEST',
                    points: 20,
                    choices: [
                        {
                            text: 'choice',
                            isCorrect: true,
                        },
                        {
                            text: 'choice 2',
                            isCorrect: false,
                        },
                    ],
                },
            ],
            title: 'TEST',
            description: 'DESCRIPTION',
            duration: 20,
        } as unknown as Quiz;
        fixture = TestBed.createComponent(CreateEditQuizPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load quiz when the page loads', () => {
        spyOn(component, 'loadQuiz');
        component.ngOnInit();

        expect(component.loadQuiz).toHaveBeenCalled();
    });

    it('should modify question', () => {
        const mockQuestion: Question = {
            type: 'QCM',
            text: 'TEST',
            points: 20,
            choices: [],
        };
        component.modifyQuestion(mockQuestion, 2);

        expect(quizQuestionInfoSpy.loadQuestionInformation).toHaveBeenCalledWith(mockQuestion, 2);
    });

    it('should disable form on general info change', () => {
        let disableForm = true;

        component.onGeneralInfoChange(disableForm);
        expect(component.shouldDisableForm).toEqual(disableForm);

        disableForm = false;

        component.onGeneralInfoChange(disableForm);
        expect(component.shouldDisableForm).toEqual(disableForm);
    });

    it('should return true if the question is valid', () => {
        const mockQuestion: Question = {
            type: 'QCM',
            text: 'TEST',
            points: 20,
            choices: [
                {
                    text: 'choice',
                    isCorrect: true,
                },
                {
                    text: 'choice 2',
                    isCorrect: false,
                },
            ],
        };

        const validQuestion = component.isQuestionValid(mockQuestion);
        expect(validQuestion).toBeTruthy();
    });

    it('should return false if the question is invalid', () => {
        const mockQuestion: Question = {
            type: 'QCM',
            text: 'TEST',
            points: 20,
            choices: [
                {
                    text: 'choice',
                    isCorrect: true,
                }, // a question requires 2 choices
            ],
        };

        const validQuestion = component.isQuestionValid(mockQuestion);
        expect(validQuestion).not.toBeTruthy();
    });

    it('should return true if the quiz form is valid', () => {
        component.newQuiz = {
            questions: [
                {
                    type: 'QCM',
                    text: 'TEST',
                    points: 20,
                    choices: [
                        {
                            text: 'choice',
                            isCorrect: true,
                        },
                        {
                            text: 'choice 2',
                            isCorrect: false,
                        },
                    ],
                },
            ],
            title: 'TEST',
            description: 'DESCRIPTION',
            duration: 20,
        } as unknown as Quiz;

        const validQuizForm = component.isQuizFormValid();
        expect(validQuizForm).toBeTruthy();
    });

    it('should return false if the quiz form is invalid', () => {
        component.newQuiz = {
            questions: [], // a quiz requires at least one question
            title: 'TEST',
            description: 'DESCRIPTION',
            duration: 20,
        } as unknown as Quiz;

        const validQuizForm = component.isQuizFormValid();
        expect(validQuizForm).not.toBeTruthy();
    });

    it('should delete a question', () => {
        component.newQuiz = mockQuiz;
        component.deleteQuestion(2);
        expect(quizManagerServiceSpy.deleteQuestion).toHaveBeenCalledWith(2, mockQuiz);
    });

    it('should move a question up', () => {
        component.newQuiz = mockQuiz;
        component.moveQuestionUp(2);
        expect(quizManagerServiceSpy.moveQuestionUp).toHaveBeenCalledWith(2, mockQuiz);
    });

    it('should move a question down', () => {
        component.newQuiz = mockQuiz;
        component.moveQuestionDown(2);
        expect(quizManagerServiceSpy.moveQuestionDown).toHaveBeenCalledWith(2, mockQuiz);
    });

    it('should save a quiz', () => {
        component.newQuiz = mockQuiz;
        component.saveQuiz();
        expect(quizManagerServiceSpy.saveQuiz).toHaveBeenCalledWith(mockQuiz);
    });

    it('should load a quiz', async () => {
        // TODO
    });

    it('should open quiz confirmation to save', async () => {
        // TODO
    });
});
