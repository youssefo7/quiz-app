import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Question, Quiz } from '@app/interfaces/quiz';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';

@Component({
    selector: 'app-quiz-question-info',
    templateUrl: './quiz-question-info.component.html',
    styleUrls: ['./quiz-question-info.component.scss'],
})
export class QuizQuestionInfoComponent implements OnInit {
    myForm: FormGroup;
    newQuiz: Quiz;
    questions: Question[];
    questionIndex: number;
    choiceIndex: number;

    questionInfoForm = this.fb.group({
        type: '',
        text: '',
        points: 10,
        choices: this.fb.array([this.createChoice(), this.createChoice(), this.createChoice(), this.createChoice()]),
    });

    disableForm = false;
    buttonText = 'Save';
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
        this.choiceIndex = 0;
    }

    roundToNearest10() {
        const incrementOf10 = 10;
        return Math.round((this.questionInfoForm.value.points as number) / incrementOf10) * incrementOf10;
    }

    getNewQuiz() {
        return this.newQuiz;
    }

    createChoice() {
        return this.fb.group({
            text: '',
            points: '',
            checked: false,
        });
    }

    onSliderClick(index: number) {
        if (index >= 0 && index < this.choices.length) {
            const choiceControl = this.choices.at(index);
            if (choiceControl.value.checked) {
                choiceControl.value.checked = false;
            } else {
                choiceControl.value.checked = true;
            }
        }
    }

    toggleButtonNameAndText() {
        this.disableForm = !this.disableForm;
        this.buttonText = this.disableForm ? 'Edit' : 'Save';
        this.buttonName = this.disableForm ? 'save' : 'edit-save'; // Update the button name
    }
}
