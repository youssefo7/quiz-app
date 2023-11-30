// any est nécessaire pour espionner les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
/* Raison : on n'a besoin de beaucoup de lignes pour set le formulaire
dans le bon état initial dépendamment du test */
/* eslint-disable max-lines */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RangeValidatorDirective } from '@app/directives/range-validator.directive';
import { Question } from '@app/interfaces/quiz';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { Constants } from '@common/constants';
import { QuizQuestionInfoComponent } from './quiz-question-info.component';
import SpyObj = jasmine.SpyObj;

describe('QuizQuestionInfoComponent', () => {
    let component: QuizQuestionInfoComponent;
    let fixture: ComponentFixture<QuizQuestionInfoComponent>;
    let mockQuizManagerService: SpyObj<QuizManagerService>;

    beforeEach(() => {
        mockQuizManagerService = jasmine.createSpyObj('QuizManagerService', ['modifyQuestion', 'addNewQuestion']);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, MatIconModule, MatSlideToggleModule, ReactiveFormsModule],
            declarations: [QuizQuestionInfoComponent, RangeValidatorDirective],
            providers: [{ provide: QuizManagerService, useValue: mockQuizManagerService }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuizQuestionInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', () => {
        expect(component).toBeTruthy();
    });

    it('should add the question and reset the form', () => {
        // Any est nécessaire pour espionner sur une méthode privée
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn<any>(component, 'manageQuestion');
        spyOn(component, 'resetForm');

        component.onSubmit();
        expect(component['manageQuestion']).toHaveBeenCalled();
        expect(component.resetForm).toHaveBeenCalled();
    });

    it('should initialize the form and add choices when page is loaded', () => {
        component['initializeForm']();
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

        component['initializeForm']();
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
        component['initializeForm']();

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

        component['manageQuestion']();

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

        component['manageQuestion']();

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
        component['initializeForm']();
        const validator = component['questionChoicesValidator']();

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
        component['initializeForm']();
        const validator = component['questionChoicesValidator']();

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
        component['initializeForm']();
        const validator = component['questionChoicesValidator']();

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
        component['initializeForm']();
        const validator = component['questionChoicesValidator']();

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
        const question: Question = {
            type: 'QCM',
            text: 'Question 1',
            points: 50,
            choices: [
                { text: 'Choice 1', isCorrect: false },
                { text: 'Choice 2', isCorrect: false },
                { text: 'Choice 3', isCorrect: true },
            ],
        };
        const choiceLength = question.choices?.length as number;
        component['initializeForm']();
        component.loadQuestionInformation(question, 0);
        expect(component.choices.length).toEqual(choiceLength);
    });

    it('should clear choices when loading a question with QRL type', () => {
        const question: Question = {
            type: 'QRL',
            text: 'Question 1',
            points: 50,
        };
        const choiceLength = question.choices?.length;
        component['initializeForm']();
        component.loadQuestionInformation(question, 0);
        expect(choiceLength).toBeUndefined();
        expect(component.choices.length).toEqual(0);
    });

    it('should adjust padding and set isTextValid to false if text is invalid and dirty', () => {
        component.questionInfoForm.controls.text.setErrors({ invalid: true });
        component.questionInfoForm.controls.text.markAsDirty();
        component.adjustPadding();
        expect(component.isTextValid).toBeFalse();
    });

    it('should adjust padding and set isTextValid to false if text is invalid and touched', () => {
        component.questionInfoForm.controls.text.setErrors({ invalid: true });
        component.questionInfoForm.controls.text.markAsTouched();
        component.adjustPadding();
        expect(component.isTextValid).toBeFalse();
    });

    it('should adjust padding and set isChoicesValid to false if choices are invalid and touched', () => {
        component.questionInfoForm.controls.type.setValue('QCM');
        component.questionInfoForm.controls.choices.setErrors({ invalid: true });
        component.questionInfoForm.controls.choices.markAsTouched();
        component.adjustPadding();
        expect(component.isChoicesValid).toBeFalse();
    });

    it('should adjust padding and set isPointsValid to false if points are invalid', () => {
        component.questionInfoForm.controls.points.setErrors({ invalid: true });
        component.adjustPadding();
        expect(component.isPointsValid).toBeFalse();
    });

    it('should adjust padding and set isChoicesValid to false if choices are invalid and dirty', () => {
        component.questionInfoForm.controls.type.setValue('QCM');
        component.questionInfoForm.controls.choices.setErrors({ invalid: true });
        component.questionInfoForm.controls.choices.markAsDirty();
        component.adjustPadding();
        expect(component.isChoicesValid).toBeFalse();
    });

    it('should update choices validators and configure choices for question of QCM type', () => {
        component.questionInfoForm.get('type')?.setValue('QCM');
        spyOn(component as any, 'configureChoicesQCM');
        spyOn(component as any, 'patchQCM');
        spyOn(component.choices, 'updateValueAndValidity');

        component.onTypeChange();

        expect(component['configureChoicesQCM']).toHaveBeenCalledWith(component.choices);
        expect(component['patchQCM']).toHaveBeenCalled();
        expect(component.choices.updateValueAndValidity).toHaveBeenCalled();
    });

    it('should clear and reset choices for a question with QRL type', () => {
        component.questionInfoForm.get('type')?.setValue('QRL');
        spyOn(component.choices, 'clear');
        spyOn(component.choices, 'clearValidators');
        spyOn(component.choices, 'reset');
        spyOn(component as any, 'patchQRL');
        spyOn(component.questionInfoForm, 'updateValueAndValidity');

        component.onTypeChange();

        expect(component.choices.clear).toHaveBeenCalled();
        expect(component.choices.clearValidators).toHaveBeenCalled();
        expect(component.choices.reset).toHaveBeenCalled();
        expect(component['patchQRL']).toHaveBeenCalled();
        expect(component.questionInfoForm.updateValueAndValidity).toHaveBeenCalled();
    });

    it('should configure choices for QCM type with the correct amount of choices if choicesCopy is not empty', () => {
        component['choicesCopy'] = [
            { text: 'Choice 1', isCorrect: false },
            { text: 'Choice 2', isCorrect: false },
            { text: 'Choice 3', isCorrect: true },
        ];
        spyOn(component, 'addChoice');
        spyOn(component as any, 'configureChoicesQCM').and.callThrough();

        component.questionInfoForm.get('type')?.setValue('QCM');
        const choicesArray1 = component.questionInfoForm.get('choices') as FormArray;
        choicesArray1.clear();

        component['configureChoicesQCM'](choicesArray1);
        expect(component.addChoice).toHaveBeenCalledTimes(component['choicesCopy'].length);
    });

    it('should configure choices for QCM type with the default amount of choices if choicesCopy is empty', () => {
        const defaultAddChoiceCalls = 2;
        component['choicesCopy'] = [];
        spyOn(component, 'addChoice');
        spyOn(component as any, 'configureChoicesQCM').and.callThrough();

        const choicesArray2 = component.questionInfoForm.get('choices') as FormArray;
        choicesArray2.clear();

        component['configureChoicesQCM'](choicesArray2);
        expect(component.addChoice).toHaveBeenCalledTimes(defaultAddChoiceCalls);
    });

    it('should not validate the question form if text and isCorrect value for a choice are undefined', () => {
        component['initializeForm']();
        const validator = component['questionChoicesValidator']();
        const invalidChoicesArray = component.choices;
        invalidChoicesArray.push(
            new FormGroup({
                text: new FormControl(undefined),
                isCorrect: new FormControl(true),
            }),
        );
        invalidChoicesArray.push(
            new FormGroup({
                text: new FormControl(''),
                isCorrect: new FormControl(undefined),
            }),
        );

        const invalidResult = validator(invalidChoicesArray);
        expect(invalidResult).toEqual({
            missingChoices: true,
        });
    });

    it('should return the button text as being "Modifier" when a question is being modified', () => {
        component['isBeingModified'] = true;
        const result = component.saveEditQuestionButtonText();
        expect(result).toEqual('Modifier');
    });

    it('should return the button text as being "Ajouter" when a new question is being created', () => {
        component['isBeingModified'] = false;
        const result = component.saveEditQuestionButtonText();
        expect(result).toEqual('Ajouter');
    });
});
