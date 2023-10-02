import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { ConfirmationPopupComponent } from '@app/components/confirmation-popup/confirmation-popup.component';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { Constants } from '@common/constants';
import { of } from 'rxjs';
import { QuizQuestionInfoComponent } from './quiz-question-info.component';

describe('QuizQuestionInfoComponent', () => {
    let component: QuizQuestionInfoComponent;
    let fixture: ComponentFixture<QuizQuestionInfoComponent>;
    // let matDialog: MatDialog;
    // let matDialogRef: MatDialogRef<ConfirmationPopupComponent>;

    beforeEach(() => {
        const quizManagerServiceSpy = jasmine.createSpyObj('QuizManagerService', ['modifyQuestion', 'addNewQuestion']);

        TestBed.configureTestingModule({
            imports: [MatDialogModule],
            declarations: [QuizQuestionInfoComponent],
            providers: [
                FormBuilder,
                { provide: QuizManagerService, useValue: quizManagerServiceSpy },
                {
                    provide: MatDialogRef,
                    useValue: {
                        afterClosed: () => of(true),
                    },
                },
                { provide: MatDialog, useClass: MatDialogMock },
            ],
        });

        fixture = TestBed.createComponent(QuizQuestionInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        // matDialog = TestBed.inject(MatDialog);
        // matDialogRef = TestBed.inject(MatDialogRef);
    });

    it('Should create the component', () => {
        expect(component).toBeTruthy();
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

    it('Should add a choice to the form array', () => {
        component.addChoice();
        expect(component.choices.length).toEqual(Constants.MIN_CHOICES + 1);
    });

    it('Should remove a choice from the form array', () => {
        component.addChoice();
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

        const quizManagerServiceSpy = TestBed.inject(QuizManagerService) as jasmine.SpyObj<QuizManagerService>;
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

        const quizManagerServiceSpy = TestBed.inject(QuizManagerService) as jasmine.SpyObj<QuizManagerService>;
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

    // it('should open the confirmation dialog and save question on confirmation', () => {
    //   spyOn(component, 'manageQuestion');
    //   spyOn(component, 'resetForm');

    //   component.openQuestionConfirmation();
    //   expect(confirmationDialogReference.componentInstance.setConfirmationText).toHaveBeenCalledWith('Sauvegarder cette question?');

    //   matDialogRef.afterClosed.and.returnValue(of(true));
    //   confirmationDialogReference.afterClosed().subscribe((wantsToSave: any) => {
    //     if (wantsToSave) {
    //       expect(component.manageQuestion).toHaveBeenCalled();
    //       expect(component.resetForm).toHaveBeenCalled();
    //     }
    //   });
    // });

    // it('should open the confirmation dialog and save question on confirmation', () => {
    //     const manageQuestionSpy = spyOn(component, 'manageQuestion');
    //     const resetFormSpy = spyOn(component, 'resetForm');
    //     spyOn(matDialog, 'open').and.returnValue(matDialogRef);
    //     component.openQuestionConfirmation();

    //     expect(matDialog.open).toHaveBeenCalledWith(ConfirmationPopupComponent, {});
    //     expect(manageQuestionSpy).toHaveBeenCalled();
    //     expect(resetFormSpy).toHaveBeenCalled();
    // });

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
});

class MatDialogMock {
    open() {
        return {
            afterClosed: () => of(true),
        };
    }
}
