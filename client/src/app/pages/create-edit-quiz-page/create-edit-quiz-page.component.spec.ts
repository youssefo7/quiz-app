import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { QuizGeneralInfoComponent } from '@app/components/quiz-general-info/quiz-general-info.component';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Question, Quiz } from '@app/interfaces/quiz';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { firstValueFrom, of } from 'rxjs';
import { CreateEditQuizPageComponent } from './create-edit-quiz-page.component';
import SpyObj = jasmine.SpyObj;

describe('CreateEditQuizPageComponent', () => {
    let component: CreateEditQuizPageComponent;
    let fixture: ComponentFixture<CreateEditQuizPageComponent>;
    let quizManagerServiceSpy: SpyObj<QuizManagerService>;
    let quizQuestionInfoSpy: QuizQuestionInfoComponent;
    let mockQuiz: Quiz;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;

    beforeEach(() => {
        quizManagerServiceSpy = jasmine.createSpyObj('NewQuizManagerService', [
            'fetchQuiz',
            'deleteQuestion',
            'moveQuestionUp',
            'moveQuestionDown',
            'saveQuiz',
        ]);
        quizQuestionInfoSpy = jasmine.createSpyObj('QuizQuestionInfoComponent', ['loadQuestionInformation', 'resetForm']);
        mockDialog = jasmine.createSpyObj('mockDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('mockDialogRef', ['componentInstance']);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [CreateEditQuizPageComponent, QuizGeneralInfoComponent, TopBarComponent, PopupMessageComponent],
            imports: [HttpClientTestingModule],
            providers: [
                { provide: QuizManagerService, useValue: quizManagerServiceSpy },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ id: 'abc' }),
                        },
                    },
                },
                { provide: MatDialog, useValue: mockDialog },
                { provide: MatDialogRef, useValue: mockDialogRef },
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
        mockDialog.open.and.returnValue(mockDialogRef);
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
        let disableForm = true;

        component.onGeneralInfoChange(disableForm);
        expect(component.shouldDisableForm).toEqual(disableForm);

        disableForm = false;

        component.onGeneralInfoChange(disableForm);
        expect(component.shouldDisableForm).toEqual(disableForm);
    });

    it('should return true if the question is valid', () => {
        const mockValidQuestion: Question = {
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

        const isValidQuestion = component.isQuestionValid(mockValidQuestion);
        expect(isValidQuestion).toBeTruthy();
    });

    it('should return false if the question is invalid', () => {
        const mockInvalidQuestion: Question = {
            type: 'QCM',
            text: 'TEST',
            points: 20,
            choices: [
                {
                    text: 'choice',
                    isCorrect: true,
                },
            ],
        };

        const isValidQuestion = component.isQuestionValid(mockInvalidQuestion);
        expect(isValidQuestion).not.toBeTruthy();
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
            questions: [],
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

    // it('should open the confirmation dialog and not call saveQuiz when wantsToSave is false', () => {
    //     spyOn(component, 'saveQuiz');
    //     dialogRefSpyObj.afterClosed.and.returnValue(of(false));
    //     matDialogSpy.open.and.returnValue(dialogRefSpyObj);

    //     component.openQuizConfirmation();

    //     expect(matDialogSpy.open).toHaveBeenCalledWith(ConfirmationPopupComponent);
    //     expect(dialogRefSpyObj.componentInstance.setConfirmationText).toHaveBeenCalledWith('Sauvegarder ce quiz?');
    //     expect(dialogRefSpyObj.afterClosed).toHaveBeenCalled();
    //     expect(component.saveQuiz).not.toHaveBeenCalled();
    // });

    it('should popup a message when the user tries to save a valid quiz', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Sauvegarder ce quiz?',
            hasCancelButton: true,
            okButtonText: 'Oui',
            cancelButtonText: 'Non',
            okButtonFunction: () => null,
        };
        mockDialog.open.and.returnValue(mockDialogRef);

        spyOn(component, 'saveQuiz');
        component.openQuizConfirmation();

        const config = mockDialogRef.componentInstance.config;
        expect(mockDialog.open).toHaveBeenCalled();
        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonText).toEqual(mockConfig.okButtonText);

        config.okButtonFunction?.();
        expect(component.saveQuiz).toHaveBeenCalled();
    });

    it('should reset form when deleting the question that is currently being edited', () => {
        component.quizQuestionInfo = quizQuestionInfoSpy;
        quizManagerServiceSpy.isModifiedQuestion = true;
        quizManagerServiceSpy.modifiedIndex = 0;
        component.deleteQuestion(0);

        expect(quizQuestionInfoSpy.resetForm).toHaveBeenCalled();
        expect(quizManagerServiceSpy.isModifiedQuestion).toBeFalsy();
    });
});
