import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Choice, Question, Quiz } from '@app/interfaces/quiz';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { Constants, QTypes } from '@common/constants';

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
    private isBeingModified: boolean;
    private choicesCopy: Choice[];

    constructor(
        private quizManagerService: QuizManagerService,
        private fb: FormBuilder,
    ) {
        this.maxChoices = Constants.MAX_CHOICES;
        this.defaultPoints = Constants.MIN_POINTS;
        this.isTextValid = true;
        this.isPointsValid = true;
        this.isChoicesValid = true;
        this.choicesCopy = [];
        this.isBeingModified = false;
    }

    get choices() {
        return this.questionInfoForm.get('choices') as FormArray;
    }

    ngOnInit() {
        this.initializeForm();
    }

    loadQuestionInformation(question: Question, index: number) {
        this.resetForm();
        this.isBeingModified = true;
        this.quizManagerService.modifiedIndex = index;
        this.quizManagerService.isModifiedQuestion = true;
        const choices = this.questionInfoForm.get('choices') as FormArray;

        if (question.type === QTypes.QCM) {
            const resetChoices = this.choices;
            const questionChoicesLength = (question.choices as Choice[]).length as number;
            while (resetChoices.length < questionChoicesLength) {
                this.addChoice();
            }
            this.choicesCopy = JSON.parse(JSON.stringify(question.choices));
            choices.setValidators(this.questionChoicesValidator());
            this.patchQCM(question.text, question.type, question.points, question.choices as Choice[]);
        } else {
            choices.clear();
            choices.clearValidators();
            choices.reset();
            this.patchQRL(question.text, question.type, question.points);
        }
        this.questionInfoForm.updateValueAndValidity();
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

    onSubmit() {
        this.manageQuestion();
        this.resetForm();
    }

    adjustPadding() {
        const questionType: string = this.questionInfoForm.get('type')?.value;

        const hasQuestionTextBeenTouched = this.questionInfoForm.controls.text.dirty || this.questionInfoForm.controls.text.touched;
        this.isTextValid = !(this.questionInfoForm.controls.text.invalid && hasQuestionTextBeenTouched);

        this.isPointsValid = !this.questionInfoForm.controls.points.invalid;

        if (questionType === QTypes.QCM) {
            const hasChoicesBeenTouched = this.questionInfoForm.controls.choices.dirty || this.questionInfoForm.controls.choices.touched;
            this.isChoicesValid = !(this.questionInfoForm.controls.choices.invalid && hasChoicesBeenTouched);
        }
    }

    resetForm() {
        this.questionInfoForm.reset();
        this.isBeingModified = false;
        this.choicesCopy = [];
        this.initializeForm();
    }

    onTypeChange() {
        const questionType = this.questionInfoForm.get('type') as AbstractControl;
        const questionText = this.questionInfoForm.get('text') as AbstractControl;
        const questionPoints = this.questionInfoForm.get('points') as AbstractControl;
        const choices = this.questionInfoForm.get('choices') as FormArray;

        if (questionType.value === QTypes.QCM || questionType.value === undefined) {
            if (!choices.hasValidator(this.questionChoicesValidator())) {
                choices.setValidators(this.questionChoicesValidator());
                this.configureChoicesQCM();
                this.patchQCM(questionText.value, questionType.value, questionPoints.value, this.choicesCopy as Choice[]);
                choices.updateValueAndValidity();
                this.questionInfoForm.updateValueAndValidity();
            }
        } else {
            choices.clear();
            choices.clearValidators();
            choices.reset();

            this.patchQRL(questionText.value, questionType.value, questionPoints.value);
            this.questionInfoForm.updateValueAndValidity();
        }
    }

    saveEditQuestionButtonText(): string {
        return this.isBeingModified ? 'Modifier' : 'Ajouter';
    }

    private initializeForm() {
        this.questionInfoForm = this.fb.group({
            type: ['QCM', Validators.required],
            text: ['', this.isQuestionTextValid()],
            points: [this.defaultPoints, Validators.required],
            choices: this.fb.array([], [this.questionChoicesValidator()]),
        });

        for (let i = 0; i < Constants.MIN_CHOICES; i++) {
            this.addChoice();
        }

        this.questionInfoForm.updateValueAndValidity();
    }

    private manageQuestion() {
        const questionType: string = this.questionInfoForm.get('type')?.value;
        const questionText: string = this.questionInfoForm.get('text')?.value;
        const questionPoints: number = this.questionInfoForm.get('points')?.value;

        const newQuestion: Question = {
            type: questionType,
            text: questionText,
            points: questionPoints,
        } as Question;

        if (questionType === QTypes.QCM) {
            const choicesArray: Choice[] = this.choices.controls.map((control: AbstractControl) => {
                const text: string = control.get('text')?.value.trim();
                const isCorrect: boolean = control.get('isCorrect')?.value;
                return { text, isCorrect };
            });

            newQuestion.choices = choicesArray;
        }

        if (this.quizManagerService.isModifiedQuestion) {
            this.quizManagerService.modifyQuestion(newQuestion, this.quizManagerService.modifiedIndex, this.newQuiz);
        } else {
            this.quizManagerService.addNewQuestion(newQuestion, this.newQuiz);
        }
    }

    private questionChoicesValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const choices = control as FormArray;

            const validChoices = choices.controls.filter((choice: AbstractControl) => {
                const text = choice.get('text')?.value ?? '';
                const isCorrect = choice.get('isCorrect')?.value ?? '';
                return text.trim().length > 0 && typeof isCorrect !== undefined;
            });

            if (validChoices.length < choices.length) {
                return { missingChoices: true };
            }

            const hasCorrectChoice = validChoices.some((choice: AbstractControl) => choice.get('isCorrect')?.value);
            const hasIncorrectChoice = validChoices.some((choice: AbstractControl) => !choice.get('isCorrect')?.value);

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

    private patchQRL(text: string, type: string, points: number) {
        this.questionInfoForm.patchValue({
            text,
            type,
            points,
        });
    }

    // La raison du disable lint est puisque choices ne provient pas toujours d'un objet question, mais aussi d'un hard copy d'une
    // question, alors au lieu d'envoyer 2 objets, on envoi les attributs nécessaires pour un objet de type Question.
    // eslint-disable-next-line max-params
    private patchQCM(text: string, type: string, points: number, choices: Choice[]) {
        this.questionInfoForm.patchValue({
            text,
            type,
            points,
            choices,
        });
    }

    private configureChoicesQCM() {
        if (!this.choicesCopy) {
            this.choicesCopy = [];
        }
        const requiredChoicesLength = this.choicesCopy.length || Constants.MIN_CHOICES;

        for (let i = 0; i < requiredChoicesLength; i++) {
            this.addChoice();
        }
    }

    private isQuestionTextValid(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const textValue = control as unknown as AbstractControl;
            return textValue.value?.trim().length === 0 ? { invalidText: true } : null;
        };
    }
}
