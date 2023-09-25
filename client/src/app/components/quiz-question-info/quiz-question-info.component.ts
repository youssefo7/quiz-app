import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { QuestionConfirmationComponent } from '@app/components/question-confirmation/question-confirmation.component';
import { Choice, Question, Quiz } from '@app/interfaces/quiz';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';

@Component({
    selector: 'app-quiz-question-info',
    templateUrl: './quiz-question-info.component.html',
    styleUrls: ['./quiz-question-info.component.scss'],
})
export class QuizQuestionInfoComponent implements OnInit {
    @Input() questionIndex: number;
    @Input() question: Question;
    @Output() questionModified = new EventEmitter<{ question: Question; index: number }>();
    newQuiz: Quiz;
    questionInfoForm: FormGroup;
    maxChoices: number;
    defaultPoints: number;

    isFormVisible = false;
    disableForm = false;
    buttonText = 'Sauvegarder';
    buttonName = 'edit-save';

    constructor(
        private quizManagerService: NewQuizManagerService,
        private fb: FormBuilder,
        public confirmationDialogReference: MatDialog,
    ) {}

    get choices() {
        return this.questionInfoForm.get('choices') as FormArray;
    }

    ngOnInit(): void {
        this.initializeForm();
    }

    initializeForm() {
        this.newQuiz = this.quizManagerService.getNewQuiz();
        this.maxChoices = 4;
        this.defaultPoints = 10;
        this.questionInfoForm = this.fb.group({
            type: ['', Validators.required],
            text: ['', Validators.required],
            points: [this.defaultPoints, Validators.required],
            choices: this.fb.array([], [this.questionChoicesValidator()]),
        });

        for (let i = 0; i < 2; i++) {
            this.addChoice();
        }
    }

    loadQuestionInformation(question: Question) {
        this.questionInfoForm.reset();
        const resetChoices = this.questionInfoForm.get('choices') as FormArray;
        while (resetChoices.length > question.choices.length) {
            resetChoices.removeAt(resetChoices.length - 1);
        }
        if (question) {
            this.questionInfoForm.patchValue({
                text: question.text,
                type: question.type,
                points: question.points,
                choices: question.choices,
            });
        } else {
            this.questionInfoForm.reset();
        }
    }

    onQuestionModified(index: number) {
        const modifiedQuestion: Question = this.getModifiedQuestion();
        this.questionModified.emit({ question: modifiedQuestion, index });
    }

    getModifiedQuestion(): Question {
        const modifiedQuestion: Question = {
            text: this.questionInfoForm.get('text')?.value,
            type: this.questionInfoForm.get('type')?.value,
            points: this.questionInfoForm.get('points')?.value,
            choices: this.questionInfoForm.get('choices')?.value,
        };
        return modifiedQuestion;
    }

    toggleForm() {
        this.isFormVisible = !this.isFormVisible;
    }

    roundToNearest10() {
        const incrementOf10 = 10;
        return Math.round((this.questionInfoForm.value.points as number) / incrementOf10) * incrementOf10;
    }

    getNewQuiz() {
        return this.newQuiz;
    }

    addChoice() {
        this.choices.push(
            this.fb.group({
                text: '',
                isCorrect: false,
            }),
        );
    }

    removeChoice(index: number) {
        this.choices.removeAt(index);
    }

    moveChoiceUp(index: number) {
        if (index > 0) {
            const choice = this.choices.at(index);
            this.choices.removeAt(index);
            this.choices.insert(index - 1, choice);
        }
    }

    moveChoiceDown(index: number) {
        if (index < this.choices.length - 1) {
            const choice = this.choices.at(index);
            this.choices.removeAt(index);
            this.choices.insert(index + 1, choice);
        }
    }

    toggleButtonNameAndText() {
        this.disableForm = !this.disableForm;
        this.buttonText = this.disableForm ? 'Modifier' : 'Sauvegarder';
        this.buttonName = this.disableForm ? 'save' : 'edit-save';
    }

    openQuestionConfirmation(): void {
        const questionDialogReference = this.confirmationDialogReference.open(QuestionConfirmationComponent);

        questionDialogReference.afterClosed().subscribe((result) => {
            if (result === true) {
                this.addNewQuestion();
                this.resetForm();
            }
        });
    }

    addNewQuestion() {
        const questionType = this.questionInfoForm.get('type')?.value;
        const questionText = this.questionInfoForm.get('text')?.value;
        const questionPoints = this.questionInfoForm.get('points')?.value;
        const choicesArray: Choice[] = this.choices.controls.map((control) => {
            control = control as FormGroup;
            const text = control.get('text')?.value || '';
            const isCorrect = control.get('isCorrect')?.value || false;
            return { text, isCorrect };
        });

        const modifiedQuestion: Question = {
            type: questionType,
            text: questionText,
            points: questionPoints,
            choices: choicesArray,
        };

        // Check if questionIndex is defined (edit mode) and emit the modified question
        if (this.questionIndex !== undefined && this.questionIndex !== null) {
            this.questionModified.emit({ question: modifiedQuestion, index: this.questionIndex });
        } else {
            // Otherwise, add a new question
            this.quizManagerService.addNewQuestion(modifiedQuestion);
        }
    }

    resetForm() {
        this.toggleForm();
        this.questionInfoForm.reset();

        this.questionInfoForm.controls.points.setValue(this.defaultPoints);
        const choices = this.questionInfoForm.get('choices') as FormArray;

        while (choices.length > 2) {
            choices.removeAt(choices.length - 1);
        }

        choices.controls.forEach((choiceControl) => {
            const choiceGroup = choiceControl as FormGroup;
            choiceGroup.get('isCorrect')?.setValue(false);
        });
    }

    questionChoicesValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const choices = control as FormArray;
            const validChoices = choices.controls.filter((choice) => {
                const text = choice.get('text')?.value || '';
                const isCorrect = choice.get('isCorrect')?.value || false;
                return text.trim().length > 0 || isCorrect;
            });
            if (validChoices.length < 2) {
                return { missingChoices: true };
            }

            const hasCorrectChoice = validChoices.some((choice) => choice.get('isCorrect')?.value === true);
            const hasIncorrectChoice = validChoices.some((choice) => choice.get('isCorrect')?.value === false);

            if (!hasCorrectChoice || !hasIncorrectChoice) {
                return { missingCorrectOrIncorrectChoice: true };
            }

            const differentChoices = new Set<string>();
            for (const choice of validChoices) {
                const text = choice.get('text')?.value.trim();
                if (text === '') {
                    return { choiceTextEmpty: true }; // New validation error for empty text
                }
                if (differentChoices.has(text)) {
                    return { duplicateChoices: true };
                }
                differentChoices.add(text);
            }

            return null;
        };
    }
}
