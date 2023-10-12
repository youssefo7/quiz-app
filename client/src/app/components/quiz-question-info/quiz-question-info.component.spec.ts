import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { RangeValidatorDirective } from '@app/directives/range-validator.directive';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { Constants } from '@common/constants';
import { QuizQuestionInfoComponent } from './quiz-question-info.component';
import SpyObj = jasmine.SpyObj;

describe('QuizQuestionInfoComponent', () => {
    let component: QuizQuestionInfoComponent;
    let fixture: ComponentFixture<QuizQuestionInfoComponent>;
    let mockQuizManagerService: SpyObj<QuizManagerService>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;

    beforeEach(() => {
        mockQuizManagerService = jasmine.createSpyObj('QuizManagerService', ['modifyQuestion', 'addNewQuestion']);
        mockDialog = jasmine.createSpyObj('mockDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj(MatDialogRef<PopupMessageComponent>, ['componentInstance']);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, MatIconModule, MatSlideToggleModule, ReactiveFormsModule],
            declarations: [QuizQuestionInfoComponent, RangeValidatorDirective, PopupMessageComponent],
            providers: [
                { provide: QuizManagerService, useValue: mockQuizManagerService },
                { provide: MatDialog, useValue: mockDialog },
                { provide: MatDialogRef, useValue: mockDialogRef },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuizQuestionInfoComponent);
        component = fixture.componentInstance;
        mockDialog.open.and.returnValue(mockDialogRef);
        fixture.detectChanges();
    });

    it('should create an instance', () => {
        expect(component).toBeTruthy();
    });

    it('should popup a message when the user tries to save a valid question', () => {
        spyOn(component, 'manageQuestion');
        spyOn(component, 'resetForm');
        component.openQuestionConfirmation();

        const config = mockDialogRef.componentInstance.config;
        expect(mockDialog.open).toHaveBeenCalled();
        expect(config.message).toEqual('Sauvegarder cette question?');
        expect(config.hasCancelButton).toEqual(true);
        expect(config.okButtonText).toEqual('Oui');
        expect(config.cancelButtonText).toEqual('Non');

        config.okButtonFunction?.();
        expect(component.manageQuestion).toHaveBeenCalled();
        expect(component.resetForm).toHaveBeenCalled();
    });

    it('should initialize the form and add choices when page is loaded', () => {
        component.initializeForm();
        expect(component.questionInfoForm.get('type')?.value).toEqual('');
        expect(component.questionInfoForm.get('text')?.value).toEqual('');
        expect(component.questionInfoForm.get('points')?.value).toEqual(Constants.MIN_POINTS);
        expect(component.choices.length).toEqual(Constants.MIN_CHOICES);
        expect(component.choices.at(0).get('text')?.value).toEqual('');
        expect(component.choices.at(0).get('isCorrect')?.value).toEqual(false);
        expect(component.choices.at(1).get('text')?.value).toEqual('');
        expect(component.choices.at(1).get('isCorrect')?.value).toEqual(false);
    });

    it('should load question information and set isModifiedQuestion flag', () => {
        const questionPoints = 90;
        const question = {
            type: 'QCM',
            text: 'Will this test pass?',
            points: questionPoints,
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
            ],
        };

        component.initializeForm();
        component.loadQuestionInformation(question, 0);
        expect(mockQuizManagerService.isModifiedQuestion).toBeTrue();
        expect(component.questionInfoForm.get('type')?.value).toEqual(question.type);
        expect(component.questionInfoForm.get('text')?.value).toEqual(question.text);
        expect(component.questionInfoForm.get('points')?.value).toEqual(question.points);
        expect(component.choices.length).toEqual(question.choices.length);
        expect(component.choices.at(0).get('text')?.value).toEqual('Choice 1');
        expect(component.choices.at(0).get('isCorrect')?.value).toEqual(true);
        expect(component.choices.at(1).get('text')?.value).toEqual('Choice 2');
        expect(component.choices.at(1).get('isCorrect')?.value).toEqual(false);
    });

    it('should round the question points up or down to the nearest 10 depending on the value', () => {
        const firstQuestionPoints = 27;
        const expectedFirstQuestionPoints = 30;

        component.questionInfoForm.get('points')?.setValue(firstQuestionPoints);
        const roundedPoints = component.roundToNearest10();
        expect(roundedPoints).toEqual(expectedFirstQuestionPoints);
    });

    it('should add and remove a choice from the form array', () => {
        component.addChoice();
        expect(component.choices.length).toEqual(Constants.MIN_CHOICES + 1);

        component.removeChoice(0);
        expect(component.choices.length).toEqual(Constants.MIN_CHOICES);
    });

    it('should move a choice up within the form array if chosen', () => {
        component.choices.at(0).get('text')?.setValue('First Choice');
        component.choices.at(1).get('text')?.setValue('Second Choice');
        component.choices.at(0).get('isCorrect')?.setValue(true);
        component.moveChoiceUp(1);

        const choices = component.choices.controls.map((control: AbstractControl) => control.value);
        expect(choices).toEqual([
            { text: 'Second Choice', isCorrect: false },
            { text: 'First Choice', isCorrect: true },
        ]);
    });

    it('should move a choice down within the form array if chosen', () => {
        component.choices.at(0).get('text')?.setValue('First Choice');
        component.choices.at(1).get('text')?.setValue('Second Choice');
        component.choices.at(0).get('isCorrect')?.setValue(true);
        component.moveChoiceDown(0);

        const choices = component.choices.controls.map((control: AbstractControl) => control.value);
        expect(choices).toEqual([
            { text: 'Second Choice', isCorrect: false },
            { text: 'First Choice', isCorrect: true },
        ]);
    });

    it('should reset the form and choices', () => {
        component.choices.at(0).get('text')?.setValue('First Choice');
        component.choices.at(0).get('isCorrect')?.setValue(true);
        component.choices.at(1).get('text')?.setValue('Second Choice');

        component.addChoice();
        component.choices.at(2).get('text')?.setValue('Third Choice');

        component.resetForm();
        component.initializeForm();

        expect(component.questionInfoForm.get('type')?.value).toEqual('');
        expect(component.questionInfoForm.get('text')?.value).toEqual('');
        expect(component.questionInfoForm.get('points')?.value).toEqual(Constants.MIN_POINTS);
        expect(component.choices.length).toEqual(Constants.MIN_CHOICES);
        expect(component.choices.at(0).get('text')?.value).toEqual('');
        expect(component.choices.at(0).get('isCorrect')?.value).toEqual(false);
        expect(component.choices.at(1).get('text')?.value).toEqual('');
        expect(component.choices.at(1).get('isCorrect')?.value).toEqual(false);
    });

    it('should correctly add a new question to the quiz', () => {
        const questionType = 'QCM';
        const questionText = 'New Question';
        const questionPoints = 50;

        component.questionInfoForm.get('type')?.setValue(questionType);
        component.questionInfoForm.get('text')?.setValue(questionText);
        component.questionInfoForm.get('points')?.setValue(questionPoints);

        const choice1 = component.choices.at(0);
        choice1.get('text')?.setValue('Choice 1');
        choice1.get('isCorrect')?.setValue(true);

        const choice2 = component.choices.at(1);
        choice2.get('text')?.setValue('Choice 2');
        choice2.get('isCorrect')?.setValue(false);

        component.manageQuestion();

        const newQuestion = {
            type: questionType,
            text: questionText,
            points: questionPoints,
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
            ],
        };
        expect(mockQuizManagerService.addNewQuestion).toHaveBeenCalledWith(newQuestion, component.newQuiz);
    });

    it('should correctly edit a question', () => {
        mockQuizManagerService.isModifiedQuestion = true;
        const questionIndex = 0;
        const questionType = 'QCM';
        const questionText = 'Modified Question';
        const questionPoints = 60;
        mockQuizManagerService.modifiedIndex = questionIndex;

        component.questionInfoForm.get('type')?.setValue(questionType);
        component.questionInfoForm.get('text')?.setValue(questionText);
        component.questionInfoForm.get('points')?.setValue(questionPoints);

        const choice1 = component.choices.at(0);
        choice1.get('text')?.setValue('Modified Choice 1');
        choice1.get('isCorrect')?.setValue(true);

        const choice2 = component.choices.at(1);
        choice2.get('text')?.setValue('Modified Choice 2');
        choice2.get('isCorrect')?.setValue(false);

        component.manageQuestion();

        const modifiedQuestion = {
            type: questionType,
            text: questionText,
            points: questionPoints,
            choices: [
                { text: 'Modified Choice 1', isCorrect: true },
                { text: 'Modified Choice 2', isCorrect: false },
            ],
        };
        expect(mockQuizManagerService.modifyQuestion).toHaveBeenCalledWith(modifiedQuestion, mockQuizManagerService.modifiedIndex, component.newQuiz);
    });

    it('should not validate the question form if choices are missing in the form', () => {
        component.initializeForm();
        const validator = component.questionChoicesValidator();

        const invalidChoicesArray = component.choices;
        invalidChoicesArray.push(
            new FormGroup({
                text: new FormControl('Choice 1'),
                isCorrect: new FormControl(true),
            }),
        );
        const invalidResult = validator(invalidChoicesArray);
        expect(invalidResult).toEqual({
            missingChoices: true,
        });
    });

    it('should not validate the question form if there is not at least one correct and one incorrect choice', () => {
        component.initializeForm();
        const validator = component.questionChoicesValidator();

        const invalidChoicesArray = component.choices;
        invalidChoicesArray.push(
            new FormGroup({
                text: new FormControl('Choice 1'),
                isCorrect: new FormControl(true),
            }),
        );
        invalidChoicesArray.push(
            new FormGroup({
                text: new FormControl('Choice 2'),
                isCorrect: new FormControl(true),
            }),
        );
        const invalidResult = validator(invalidChoicesArray);
        expect(invalidResult).toEqual({
            missingCorrectOrIncorrectChoice: true,
        });
    });

    it('should not validate the question form if there are choices with the same text', () => {
        component.initializeForm();
        const validator = component.questionChoicesValidator();

        const invalidChoicesArray = component.choices;
        invalidChoicesArray.push(
            new FormGroup({
                text: new FormControl('Choice 1'),
                isCorrect: new FormControl(true),
            }),
        );
        invalidChoicesArray.push(
            new FormGroup({
                text: new FormControl('Choice 1'),
                isCorrect: new FormControl(false),
            }),
        );

        const invalidResult = validator(invalidChoicesArray);
        expect(invalidResult).toEqual({
            duplicateChoices: true,
        });
    });

    it('should validate the question form if the choices for a new or modified question respect all conditions', () => {
        component.initializeForm();
        const validator = component.questionChoicesValidator();

        const validChoicesArray = component.choices;
        validChoicesArray.push(
            new FormGroup({
                text: new FormControl('Choice 1'),
                isCorrect: new FormControl(true),
            }),
        );
        validChoicesArray.push(
            new FormGroup({
                text: new FormControl('Choice 2'),
                isCorrect: new FormControl(false),
            }),
        );
        validChoicesArray.push(
            new FormGroup({
                text: new FormControl('Choice 3'),
                isCorrect: new FormControl(false),
            }),
        );
        const validResult = validator(validChoicesArray);
        expect(validResult).toBeNull();
    });

    it('should add choices when loading a question with more choices', () => {
        const question = {
            type: 'QCM',
            text: 'Question 1',
            points: 50,
            choices: [
                { text: 'Choice 1', isCorrect: false },
                { text: 'Choice 2', isCorrect: false },
                { text: 'Choice 3', isCorrect: true },
            ],
        };
        component.initializeForm();
        component.loadQuestionInformation(question, 0);
        expect(component.choices.length).toEqual(question.choices.length);
    });
});
