import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot, convertToParamMap } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { QuizGeneralInfoComponent } from '@app/components/quiz-general-info/quiz-general-info.component';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { Question, Quiz } from '@app/interfaces/quiz';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { firstValueFrom, of } from 'rxjs';
import { CreateEditQuizPageComponent, exitCreateEditQuizPageGuard } from './create-edit-quiz-page.component';
import SpyObj = jasmine.SpyObj;

describe('CreateEditQuizPageComponent', () => {
    let component: CreateEditQuizPageComponent;
    let fixture: ComponentFixture<CreateEditQuizPageComponent>;
    let quizManagerServiceSpy: SpyObj<QuizManagerService>;
    let quizQuestionInfoSpy: QuizQuestionInfoComponent;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;
    const mockQuiz: Quiz = {
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

    beforeEach(() => {
        quizManagerServiceSpy = jasmine.createSpyObj('NewQuizManagerService', [
            'fetchQuiz',
            'deleteQuestion',
            'moveQuestionUp',
            'moveQuestionDown',
            'saveQuiz',
            'hasQuizBeenModified',
        ]);
        quizQuestionInfoSpy = jasmine.createSpyObj('QuizQuestionInfoComponent', ['loadQuestionInformation', 'resetForm']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef<PopupMessageComponent>', ['componentInstance', 'afterClosed']);
        mockDialogRef.afterClosed.and.returnValue(of(true));
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
        }).compileComponents();
    }));

    beforeEach(() => {
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

    it('should change isGeneralInfoFormValid correctly', () => {
        let shouldBlockSubmit = true;
        component.setIsGeneralInfoFormValid(shouldBlockSubmit);
        expect(component.isGeneralInfoFormValid).toEqual(!shouldBlockSubmit);

        shouldBlockSubmit = false;
        component.setIsGeneralInfoFormValid(shouldBlockSubmit);
        expect(component.isGeneralInfoFormValid).toEqual(!shouldBlockSubmit);
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

    it('should popup a message when the user tries to save a valid quiz', () => {
        spyOn(component, 'saveQuiz');
        component.openQuizConfirmation();

        const config = mockDialogRef.componentInstance.config;
        expect(mockDialog.open).toHaveBeenCalled();
        expect(config.message).toEqual('Sauvegarder ce quiz?');
        expect(config.hasCancelButton).toEqual(true);
        expect(config.okButtonText).toEqual('Oui');
        expect(config.cancelButtonText).toEqual('Non');

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

    it('should return false if newQuiz has no questions', () => {
        component.newQuiz = { ...mockQuiz, questions: [] };
        component.isGeneralInfoFormValid = true;
        expect(component.isQuizFormValid()).toBeFalse();
    });

    it('should return true if all conditions are met for a modified quiz', () => {
        component.newQuiz = mockQuiz;
        component.isGeneralInfoFormValid = true;
        quizManagerServiceSpy.hasQuizBeenModified.and.returnValue(true);

        component.isQuizFormValid();
        expect(quizManagerServiceSpy.hasQuizBeenModified).toHaveBeenCalledWith(component.newQuiz);
        expect(component.isQuizFormValid()).toBeTrue();
    });

    it('should not check modifications for a new quiz', () => {
        component.newQuiz = { ...mockQuiz, id: '' };
        component.isGeneralInfoFormValid = true;
        expect(quizManagerServiceSpy.hasQuizBeenModified).not.toHaveBeenCalled();
        expect(component.isQuizFormValid()).toBeTrue();
    });

    it('should show popup and allow page to exit if the "Quitter" option is chosen ', waitForAsync(() => {
        component.openPageExitConfirmation();

        const config = mockDialogRef.componentInstance.config;
        expect(mockDialog.open).toHaveBeenCalled();
        expect(config.message).toEqual('Quitter la page? Toutes les informations non enregistrées seront supprimées');
        expect(config.hasCancelButton).toEqual(true);
        expect(config.okButtonText).toEqual('Quitter');
        expect(config.cancelButtonText).toEqual('Annuler');

        config.okButtonFunction?.();

        expect(component.shouldExitCreateEditQuizPage).toBeTrue();
    }));

    it('should show popup when user is trying to exit the page', () => {
        const mockCurrentRoute: ActivatedRouteSnapshot = {} as unknown as ActivatedRouteSnapshot;
        const mockRouterState: RouterStateSnapshot = {} as unknown as RouterStateSnapshot;
        spyOn(component, 'openPageExitConfirmation');
        exitCreateEditQuizPageGuard(component, mockCurrentRoute, mockRouterState, mockRouterState);
        expect(component.openPageExitConfirmation).toHaveBeenCalled();
    });

    it('should not show popup when the user saves the quiz', () => {
        const mockCurrentRoute: ActivatedRouteSnapshot = {} as unknown as ActivatedRouteSnapshot;
        const mockRouterState: RouterStateSnapshot = {} as unknown as RouterStateSnapshot;
        spyOn(component, 'openPageExitConfirmation');
        component.newQuiz = mockQuiz;
        component.saveQuiz();
        exitCreateEditQuizPageGuard(component, mockCurrentRoute, mockRouterState, mockRouterState);
        expect(component.openPageExitConfirmation).not.toHaveBeenCalled();
    });
});
