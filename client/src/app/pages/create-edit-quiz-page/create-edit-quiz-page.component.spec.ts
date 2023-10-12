import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ConfirmationPopupComponent } from '@app/components/confirmation-popup/confirmation-popup.component';
import { QuizGeneralInfoComponent } from '@app/components/quiz-general-info/quiz-general-info.component';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { Question, Quiz } from '@app/interfaces/quiz';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { firstValueFrom, of } from 'rxjs';
import { CreateEditQuizPageComponent } from './create-edit-quiz-page.component';
import SpyObj = jasmine.SpyObj;

describe('CreateEditQuizPageComponent', () => {
    let component: CreateEditQuizPageComponent;
    let fixture: ComponentFixture<CreateEditQuizPageComponent>;
    let matDialogSpy: SpyObj<MatDialog>;
    let quizManagerServiceSpy: SpyObj<QuizManagerService>;
    let quizQuestionInfoSpy: QuizQuestionInfoComponent;
    let mockQuiz: Quiz;
    let dialogRefSpyObj: jasmine.SpyObj<MatDialogRef<ConfirmationPopupComponent>>;

    beforeEach(() => {
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        quizManagerServiceSpy = jasmine.createSpyObj('NewQuizManagerService', [
            'fetchQuiz',
            'deleteQuestion',
            'moveQuestionUp',
            'moveQuestionDown',
            'saveQuiz',
            'hasQuizModified',
        ]);
        quizQuestionInfoSpy = jasmine.createSpyObj('QuizQuestionInfoComponent', ['loadQuestionInformation', 'resetForm']);
        dialogRefSpyObj = jasmine.createSpyObj<MatDialogRef<ConfirmationPopupComponent>>('MatDialogRef', ['afterClosed'], {
            componentInstance: jasmine.createSpyObj('ConfirmationPopupComponent', ['setConfirmationText']),
        });
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [CreateEditQuizPageComponent, QuizGeneralInfoComponent, TopBarComponent],
            imports: [HttpClientTestingModule],
            providers: [
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: QuizManagerService, useValue: quizManagerServiceSpy },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ id: 'abc' }),
                        },
                    },
                },
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
            id: 'abc',
        } as unknown as Quiz;
        fixture = TestBed.createComponent(CreateEditQuizPageComponent);
        component = fixture.componentInstance;
        component.quizToModify = {
            $schema: 'quiz-schema.json',
            id: '1',
            title: 'Title',
            description: 'Description',
            duration: 30,
            lastModification: '',
            questions: [
                {
                    type: 'QCM',
                    text: 'Question 1',
                    points: 10,
                    choices: [
                        { text: 'Choice 1', isCorrect: true },
                        { text: 'Choice 2', isCorrect: false },
                    ],
                },
            ],
        } as unknown as Quiz;
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
            choices: [
                {
                    text: 'choice',
                    isCorrect: true,
                },
                {
                    text: 'choice',
                    isCorrect: false,
                },
            ],
        };
        component.quizQuestionInfo = quizQuestionInfoSpy;
        component.modifyQuestion(mockQuestion, 2);
        expect(quizQuestionInfoSpy.loadQuestionInformation).toHaveBeenCalledWith(mockQuestion, 2);
    });

    it('should disable form on general info change', () => {
        let isGeneralInfoFormValid = true;

        component.onGeneralInfoChange(isGeneralInfoFormValid);
        expect(component.isGeneralInfoFormValid).toEqual(isGeneralInfoFormValid);

        isGeneralInfoFormValid = false;
        component.onGeneralInfoChange(isGeneralInfoFormValid);
        expect(component.isGeneralInfoFormValid).toEqual(isGeneralInfoFormValid);
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

    it('should save a quiz if newQuiz is defined', () => {
        component.newQuiz = mockQuiz;
        component.saveQuiz();
        expect(quizManagerServiceSpy.saveQuiz).toHaveBeenCalledWith(mockQuiz);
    });

    it('should not save a quiz if newQuiz is not defined', () => {
        component.saveQuiz();
        expect(quizManagerServiceSpy.saveQuiz).not.toHaveBeenCalled();
    });

    it('should load the correct quiz', fakeAsync(() => {
        component.loadQuiz();
        tick();
        expect(quizManagerServiceSpy.fetchQuiz).toHaveBeenCalledWith(mockQuiz.id);
    }));

    it("should assign the page title to be 'Créer un jeu questionnaire' if newQuiz is undefined", fakeAsync(() => {
        component.loadQuiz();
        tick();
        expect(component.pageTitle).toEqual('Créer un jeu questionnaire');
    }));

    it("should assign the page title to be 'Modifier un jeu questionnaire' if newQuiz is defined", fakeAsync(() => {
        quizManagerServiceSpy.fetchQuiz.and.returnValue(firstValueFrom(of(mockQuiz)));
        component.loadQuiz();
        tick();
        expect(component.pageTitle).toEqual('Modifier un jeu questionnaire');
    }));

    it('should open the confirmation dialog and call saveQuiz when wantsToSave is true', () => {
        spyOn(component, 'saveQuiz');
        dialogRefSpyObj.afterClosed.and.returnValue(of(true));
        matDialogSpy.open.and.returnValue(dialogRefSpyObj);

        component.openQuizConfirmation();
        expect(matDialogSpy.open).toHaveBeenCalledWith(ConfirmationPopupComponent);
        expect(dialogRefSpyObj.componentInstance.setConfirmationText).toHaveBeenCalledWith('Sauvegarder ce quiz?');
        expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled();
        expect(component.saveQuiz).toHaveBeenCalled();
    });

    it('should open the confirmation dialog and not call saveQuiz when wantsToSave is false', () => {
        spyOn(component, 'saveQuiz');
        dialogRefSpyObj.afterClosed.and.returnValue(of(false));
        matDialogSpy.open.and.returnValue(dialogRefSpyObj);

        component.openQuizConfirmation();
        expect(matDialogSpy.open).toHaveBeenCalledWith(ConfirmationPopupComponent);
        expect(dialogRefSpyObj.componentInstance.setConfirmationText).toHaveBeenCalledWith('Sauvegarder ce quiz?');
        expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled();
        expect(component.saveQuiz).not.toHaveBeenCalled();
    });

    it('should reset form when deleting the question that is currently being edited', () => {
        component.quizQuestionInfo = quizQuestionInfoSpy;
        quizManagerServiceSpy.isModifiedQuestion = true;
        quizManagerServiceSpy.modifiedIndex = 0;
        component.deleteQuestion(0);

        expect(quizQuestionInfoSpy.resetForm).toHaveBeenCalled();
        expect(quizManagerServiceSpy.isModifiedQuestion).toBeFalsy();
    });

    it('should return false if newQuiz is undefined', () => {
        component.newQuiz = undefined as unknown as Quiz;
        component.isGeneralInfoFormValid = true;
        expect(component.isQuizFormValid()).toBeFalse();
    });

    it('should return false if newQuiz has no questions', () => {
        component.newQuiz = { ...mockQuiz, questions: [] };
        component.isGeneralInfoFormValid = true;
        expect(component.isQuizFormValid()).toBeFalse();
    });

    it('should return false if any of the questions in a quiz are invalid', () => {
        const invalidQuestion = {
            type: 'QCM',
            text: 'Invalid Question',
            points: 20,
            choices: [
                { text: 'choice 1', isCorrect: false },
                { text: 'choice 2', isCorrect: true },
            ],
        };
        component.newQuiz = { ...mockQuiz, questions: [mockQuiz.questions[0], invalidQuestion] };
        component.isGeneralInfoFormValid = true;
        expect(component.isQuizFormValid()).toBeFalse();
    });

    it('should return false if the general info form is invalid', () => {
        const invalidQuiz = {
            ...mockQuiz,
            title: '',
            description: '',
            duration: 5,
        };
        component.newQuiz = invalidQuiz;
        component.isGeneralInfoFormValid = false;
        expect(component.isQuizFormValid()).toBeFalse();
    });

    it('should return true if all conditions are met for a modified quiz', () => {
        const validQuiz: Quiz = {
            $schema: 'quiz-schema.json',
            id: '',
            title: 'Valid Title',
            description: 'Valid Description',
            duration: 15,
            lastModification: '',
            questions: [
                {
                    type: 'QCM',
                    text: 'Valid Question',
                    points: 20,
                    choices: [
                        { text: 'Valid Choice 1', isCorrect: true },
                        { text: 'Valid Choice 2', isCorrect: false },
                    ],
                },
            ],
        };
        component.newQuiz = validQuiz;
        component.isGeneralInfoFormValid = false;
        quizManagerServiceSpy.hasQuizModified.and.returnValue(true);
        expect(component.isQuizFormValid()).toBeTrue();
    });

    it('should return true if all conditions are met', () => {
        const validQuiz: Quiz = {
            $schema: 'quiz-schema.json',
            id: '1',
            title: 'Valid Title',
            description: 'Valid Description',
            duration: 15,
            lastModification: '',
            questions: [
                {
                    type: 'QCM',
                    text: 'Valid Question',
                    points: 20,
                    choices: [
                        { text: 'Valid Choice 1', isCorrect: true },
                        { text: 'Valid Choice 2', isCorrect: false },
                    ],
                },
            ],
        };
        component.newQuiz = validQuiz;
        component.isGeneralInfoFormValid = false;
        quizManagerServiceSpy.hasQuizModified.and.returnValue(true);
        expect(component.isQuizFormValid()).toBeTrue();
    });

    it('should return true if the quiz is modified', () => {
        component.newQuiz = mockQuiz;
        component.isGeneralInfoFormValid = false;
        quizManagerServiceSpy.hasQuizModified.and.returnValue(true);
        expect(component.isQuizFormValid()).toBeTrue();
    });

    it('should return false if the quiz is not modified', () => {
        component.newQuiz = mockQuiz;
        component.isGeneralInfoFormValid = true;
        quizManagerServiceSpy.hasQuizModified.and.returnValue(false);
        expect(component.isQuizFormValid()).toBeFalse();
    });
});
