import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Choice, Question, Quiz } from '@app/interfaces/quiz';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { Constants } from '@common/constants';

@Component({
    selector: 'app-quiz-question-info',
    templateUrl: './quiz-question-info.component.html',
    styleUrls: ['./quiz-question-info.component.scss'],
})
export class QuizQuestionInfoComponent implements OnInit {
    @Input() newQuiz: Quiz;
    questionInfoForm: FormGroup;
    maxChoices: number;
    defaultPoints: number;
    isTextValid: boolean;
    isPointsValid: boolean;
    isChoicesValid: boolean;

    constructor(
        private quizManagerService: QuizManagerService,
        private fb: FormBuilder,
    ) {
        this.maxChoices = Constants.MAX_CHOICES;
        this.defaultPoints = Constants.MIN_POINTS;
        this.isTextValid = true;
        this.isPointsValid = true;
        this.isChoicesValid = true;
    }

    get choices() {
        return this.questionInfoForm.get('choices') as FormArray;
    }

    ngOnInit(): void {
        this.initializeForm();
    }

    initializeForm() {
        this.questionInfoForm = this.fb.group({
            type: ['', Validators.required],
            text: ['', Validators.required],
            points: [this.defaultPoints, Validators.required],
            choices: this.fb.array([], [this.questionChoicesValidator()]),
        });

        for (let i = 0; i < Constants.MIN_CHOICES; i++) {
            this.addChoice();
        }
    }

    loadQuestionInformation(question: Question, index: number) {
        this.resetForm();
        this.quizManagerService.modifiedIndex = index;
        const resetChoices = this.choices;

        while (resetChoices.length < question.choices.length) {
            this.addChoice();
        }

        this.quizManagerService.isModifiedQuestion = true;
        this.questionInfoForm.patchValue({
            text: question.text,
            type: question.type,
            points: question.points,
            choices: question.choices,
        });
    }

    roundToNearest10() {
        const pointsStep = 10;
        return Math.round((this.questionInfoForm.value.points as number) / pointsStep) * pointsStep;
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
        if (index) {
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

    onSubmit() {
        this.manageQuestion();
        this.resetForm();
    }

    manageQuestion() {
        const questionType: string = this.questionInfoForm.get('type')?.value;
        const questionText: string = this.questionInfoForm.get('text')?.value;
        const questionPoints: number = this.questionInfoForm.get('points')?.value;

        const choicesArray: Choice[] = this.choices.controls.map((control: AbstractControl) => {
            const text: string = control.get('text')?.value;
            const isCorrect: boolean = control.get('isCorrect')?.value;
            return { text, isCorrect };
        });

        const newQuestion: Question = {
            type: questionType,
            text: questionText,
            points: questionPoints,
            choices: choicesArray,
        };

        if (this.quizManagerService.isModifiedQuestion) {
            this.quizManagerService.modifyQuestion(newQuestion, this.quizManagerService.modifiedIndex, this.newQuiz);
        } else {
            this.quizManagerService.addNewQuestion(newQuestion, this.newQuiz);
        }
    }

    resetForm() {
        this.questionInfoForm.reset();

        this.questionInfoForm.controls.points.setValue(this.defaultPoints);

        while (this.choices.length > Constants.MIN_CHOICES) {
            this.choices.removeAt(this.choices.length - 1);
        }

        this.choices.controls.forEach((choiceControl: AbstractControl) => {
            const choiceGroup = choiceControl as FormGroup;
            choiceGroup.get('isCorrect')?.setValue(false);
        });
    }

    questionChoicesValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const choices = control as FormArray;

            const validChoices = choices.controls.filter((choice: AbstractControl) => {
                const text = choice.get('text')?.value ?? '';
                const isCorrect = choice.get('isCorrect')?.value ?? '';
                return text.trim().length > 0 && typeof isCorrect !== undefined;
            });

            if (validChoices.length < Constants.MIN_CHOICES) {
                return { missingChoices: true };
            }

            const hasCorrectChoice = validChoices.some((choice: AbstractControl) => choice.get('isCorrect')?.value === true);
            const hasIncorrectChoice = validChoices.some((choice: AbstractControl) => choice.get('isCorrect')?.value === false);

            if (!hasCorrectChoice || !hasIncorrectChoice) {
                return { missingCorrectOrIncorrectChoice: true };
            }

            const differentChoices = new Set<string>();
            for (const choice of validChoices) {
                const text = choice.get('text')?.value.trim();
                if (differentChoices.has(text)) {
                    return { duplicateChoices: true };
                }
                differentChoices.add(text);
            }

            return null;
        };
    }

    adjustPadding() {
        const hasTextBeenTouched = this.questionInfoForm.controls.text.dirty || this.questionInfoForm.controls.text.touched;
        this.isTextValid = this.questionInfoForm.controls.text.invalid && hasTextBeenTouched ? false : true;

        this.isPointsValid = this.questionInfoForm.controls.points.invalid ? false : true;

        const hasChoicesBeenTouched = this.questionInfoForm.controls.choices.dirty || this.questionInfoForm.controls.choices.touched;
        this.isChoicesValid = this.questionInfoForm.controls.text.invalid && hasChoicesBeenTouched ? false : true;
    }
}
