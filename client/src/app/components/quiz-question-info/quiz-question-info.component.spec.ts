import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { Constants } from '@common/constants';
import { of } from 'rxjs';
import { QuizQuestionInfoComponent } from './quiz-question-info.component';

describe('QuizQuestionInfoComponent', () => {
    let component: QuizQuestionInfoComponent;
    let fixture: ComponentFixture<QuizQuestionInfoComponent>;
    let mockMatDialog: MatDialog;

    // beforeEach(() => {
    //     const quizManagerServiceSpy = jasmine.createSpyObj('QuizManagerService', ['modifyQuestion', 'addNewQuestion']);
    //     TestBed.configureTestingModule({
    //         imports: [HttpClientTestingModule],
    //         declarations: [QuizQuestionInfoComponent],
    //         providers: [
    //             FormBuilder,
    //             { provide: MatDialog, useValue: { open: () => {} } },
    //             { provide: QuizManagerService, useValue: quizManagerServiceSpy },
    //         ],
    //     });

    //     fixture = TestBed.createComponent(QuizQuestionInfoComponent);
    //     component = fixture.componentInstance;
    //     fixture.detectChanges();
    //     mockMatDialog = TestBed.inject(MatDialog);
    // });

    beforeEach(() => {
        const quizManagerServiceSpy = jasmine.createSpyObj('QuizManagerService', ['modifyQuestion', 'addNewQuestion']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            declarations: [QuizQuestionInfoComponent],
            providers: [
                FormBuilder,
                {
                    provide: MatDialog,
                    useValue: {
                        open: () => ({
                            componentInstance: {
                                setConfirmationText: () => 'Sauvegarder cette question?',
                            },
                            afterClosed: () => of(true),
                        }),
                    },
                },
                { provide: QuizManagerService, useValue: quizManagerServiceSpy },
            ],
        });
        fixture = TestBed.createComponent(QuizQuestionInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        mockMatDialog = TestBed.inject(MatDialog);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open the confirmation dialog and call manageQuestion when wantsToSave is true', () => {
        spyOn(mockMatDialog, 'open').and.returnValue({
            componentInstance: {
                setConfirmationText: () => {
                    'Sauvegarder cette question?';
                },
            },
            afterClosed: () => {
                return of(true);
            },
        } as MatDialogRef<unknown>);

        spyOn(component, 'manageQuestion');
        component.ngOnInit();
        component.openQuestionConfirmation();

        expect(mockMatDialog.open).toHaveBeenCalled();
        expect(component.manageQuestion).toHaveBeenCalled();
    });

    it('Should initialize the form and add choices when page is loaded', () => {
        component.initializeForm();
        expect(component.questionInfoForm.get('type')?.value).toEqual('');
        expect(component.questionInfoForm.get('text')?.value).toEqual('');
        expect(component.questionInfoForm.get('points')?.value).toEqual(Constants.MIN_POINTS);
        expect(component.choices.length).toEqual(Constants.MIN_CHOICES);
    });

    it('Should load question information and set isModifiedQuestion flag', () => {
        const questionPoints = 90;
        const question = {
            type: 'QCM',
            text: 'Will this test pass?',
            points: questionPoints,
            choices: [
                { text: 'Choice 1', isCorrect: false },
                { text: 'Choice 2', isCorrect: false },
            ],
        };

        component.initializeForm();
        component.loadQuestionInformation(question, 0);
        expect(component.isModifiedQuestion).toBeTrue();
        expect(component.questionInfoForm.get('type')?.value).toEqual(question.type);
        expect(component.questionInfoForm.get('text')?.value).toEqual(question.text);
        expect(component.questionInfoForm.get('points')?.value).toEqual(question.points);
        expect(component.choices.length).toEqual(question.choices.length);
    });

    it('Should round the question points up or down to the nearest 10 depending on the value', () => {
        const firstQuestionPoints = 27;
        const expectedFirstQuestion = 30;

        component.questionInfoForm.get('points')?.setValue(firstQuestionPoints);
        const roundedPoints = component.roundToNearest10();
        expect(roundedPoints).toEqual(expectedFirstQuestion);
    });

    it('Should add and remove a choice from the form array', () => {
        component.addChoice();
        expect(component.choices.length).toEqual(Constants.MIN_CHOICES + 1);

        component.removeChoice(0);
        expect(component.choices.length).toEqual(Constants.MIN_CHOICES);
    });

    it('Should move a choice up within the form array if chosen', () => {
        component.choices.at(0).get('text')?.setValue('First Choice');
        component.choices.at(1).get('text')?.setValue('Second Choice');
        component.choices.at(0).get('isCorrect')?.setValue(true);
        component.moveChoiceUp(1);

        const choices = component.choices.controls.map((control) => control.value);
        expect(choices).toEqual([
            { text: 'Second Choice', isCorrect: false },
            { text: 'First Choice', isCorrect: true },
        ]);
    });

    it('Should move a choice down within the form array if chosen', () => {
        component.choices.at(0).get('text')?.setValue('First Choice');
        component.choices.at(1).get('text')?.setValue('Second Choice');
        component.choices.at(0).get('isCorrect')?.setValue(true);
        component.moveChoiceDown(0);

        const choices = component.choices.controls.map((control) => control.value);
        expect(choices).toEqual([
            { text: 'Second Choice', isCorrect: false },
            { text: 'First Choice', isCorrect: true },
        ]);
    });

    it('should reset the form and choices', () => {
        const addChoiceSpy = spyOn(component, 'addChoice').and.callThrough();
        component.addChoice();
        component.addChoice();

        component.resetForm();
        expect(addChoiceSpy).toHaveBeenCalledTimes(2);
        component.ngOnInit();

        expect(component.questionInfoForm.get('type')?.value).toEqual('');
        expect(component.questionInfoForm.get('text')?.value).toEqual('');
        expect(component.questionInfoForm.get('points')?.value).toEqual(Constants.MIN_POINTS);
        expect(component.choices.length).toEqual(Constants.MIN_CHOICES);
        expect(addChoiceSpy).toHaveBeenCalledWith();
    });

    it('Should manage the a new question by adding a new question to the quiz', () => {
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

        const quizManagerServiceSpy = TestBed.inject(QuizManagerService);
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
        expect(quizManagerServiceSpy.addNewQuestion).toHaveBeenCalledWith(newQuestion, component.newQuiz);
        expect(component.isModifiedQuestion).toBeFalse();
    });

    it('Should manage the modified question by modifying an existing question in the quiz', () => {
        component.isModifiedQuestion = true;
        const questionType = 'QCM';
        const questionText = 'Modified Question';
        const questionPoints = 60;

        component.questionInfoForm.get('type')?.setValue(questionType);
        component.questionInfoForm.get('text')?.setValue(questionText);
        component.questionInfoForm.get('points')?.setValue(questionPoints);

        const choice1 = component.choices.at(0);
        choice1.get('text')?.setValue('Modified Choice 1');
        choice1.get('isCorrect')?.setValue(true);

        const choice2 = component.choices.at(1);
        choice2.get('text')?.setValue('Modified Choice 2');
        choice2.get('isCorrect')?.setValue(false);

        const quizManagerServiceSpy = TestBed.inject(QuizManagerService);
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
        expect(quizManagerServiceSpy.modifyQuestion).toHaveBeenCalledWith(modifiedQuestion, component.modifiedIndex, component.newQuiz);
        expect(component.isModifiedQuestion).toBeFalse();
    });

    it('Should not validate the the question form if choices are missing in the form', () => {
        component.initializeForm();
        const validator = component.questionChoicesValidator();

        const invalidChoicesArray = component.choices as FormArray;
        invalidChoicesArray.push(
            new FormGroup({
                text: new FormControl('Choice 1'),
                isCorrect: new FormControl(true),
            }),
        );
        const invalidChoicesControl = new FormBuilder().array(invalidChoicesArray.controls, validator);
        const invalidResult = validator(invalidChoicesControl);
        expect(invalidResult).toEqual({
            missingChoices: true,
        });
    });

    it('Should not validate the question form if there is not at least one correct and one incorrect choice', () => {
        component.initializeForm();
        const validator = component.questionChoicesValidator();

        const invalidChoicesArray = component.choices as FormArray;
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
        const invalidChoicesControl = new FormBuilder().array(invalidChoicesArray.controls, validator);
        const invalidResult = validator(invalidChoicesControl);
        expect(invalidResult).toEqual({
            missingCorrectOrIncorrectChoice: true,
        });
    });

    it('Should not validate the question form if there are choices with the same text', () => {
        component.initializeForm();
        const validator = component.questionChoicesValidator();

        const invalidChoicesArray = component.choices as FormArray;
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

        const invalidChoicesControl = new FormBuilder().array(invalidChoicesArray.controls, validator);
        const invalidResult = validator(invalidChoicesControl);
        expect(invalidResult).toEqual({
            duplicateChoices: true,
        });
    });

    it('Should validate the question form if the choices for a new or modified question respect all conditions', () => {
        component.initializeForm();
        const validator = component.questionChoicesValidator();

        const validChoicesArray = component.choices as FormArray;
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
        const validChoicesControl = new FormBuilder().array(validChoicesArray.controls, validator);
        const validResult = validator(validChoicesControl);
        expect(validResult).toBeNull();
    });

    it('Should add choices in while loop when loading a question with more choices', () => {
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
