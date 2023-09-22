import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Choice, Question, Quiz } from '@app/interfaces/quiz';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';

@Component({
    selector: 'app-quiz-question-info',
    templateUrl: './quiz-question-info.component.html',
    styleUrls: ['./quiz-question-info.component.scss'],
})
export class QuizQuestionInfoComponent implements OnInit {
    // myForm: FormGroup;
    newQuiz: Quiz;
    questions: Question[];
    questionIndex: number;
    questionInfoForm: FormGroup;
    maxChoices: number;
    formSubmitted = false;

    disableForm = false;
    buttonText = 'Sauvegarder';
    buttonName = 'edit-save';

    constructor(
        private quizManagerService: NewQuizManagerService,
        private fb: FormBuilder,
    ) {}

    get choices() {
        return this.questionInfoForm.get('choices') as FormArray;
    }

    ngOnInit(): void {
        this.newQuiz = this.quizManagerService.getNewQuiz();
        this.questions = this.quizManagerService.getNewQuizQuestions();
        this.questionIndex = 0;
        this.maxChoices = 4;
        this.questionInfoForm = this.fb.group({
            type: '',
            text: '',
            points: 10,
            choices: this.fb.array([], [this.questionChoicesValidator()]),
        });

        for (let i = 0; i < 2; i++) {
            this.addChoice();
        }
    }

    roundToNearest10() {
        const incrementOf10 = 10;
        return Math.round((this.questionInfoForm.value.points as number) / incrementOf10) * incrementOf10;
    }

    getNewQuiz() {
        return this.newQuiz;
    }

    toggleButtonNameAndText() {
        this.disableForm = !this.disableForm;
        this.buttonText = this.disableForm ? 'Modifier' : 'Sauvegarder';
        this.buttonName = this.disableForm ? 'save' : 'edit-save';
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
        const questionText = this.questionInfoForm.get('text')?.value;
        const questionPoints = this.questionInfoForm.get('points')?.value;
        const choicesArray: Choice[] = this.choices.controls.map((control) => {
            control = control as FormGroup;
            const text = control.get('text')?.value || '';
            const isCorrect = control.get('isCorrect')?.value || false;
            return { text, isCorrect };
        });

        this.newQuiz.questions[this.questionIndex].text = questionText;
        this.newQuiz.questions[this.questionIndex].points = questionPoints;
        this.newQuiz.questions[this.questionIndex].choices = choicesArray;
        this.formSubmitted = true;
    }

    questionChoicesValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const choices = control as FormArray;
            const validChoices = choices.controls.filter((choice) => {
                const text = choice.get('text')?.value || '';
                const isCorrect = choice.get('isCorrect')?.value || false;
                return text.trim() !== '' || isCorrect;
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
                if (differentChoices.has(text)) {
                    return { duplicateChoices: true };
                }
                differentChoices.add(text);
            }

            return null;
        };
    }
}
