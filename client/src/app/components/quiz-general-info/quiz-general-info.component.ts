import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Quiz } from '@app/interfaces/quiz';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';

@Component({
    selector: 'app-quiz-general-info',
    templateUrl: './quiz-general-info.component.html',
    styleUrls: ['./quiz-general-info.component.scss'],
})
export class QuizGeneralInfoComponent implements OnInit {
    myForm: FormGroup;
    newQuiz: Quiz;

    disableForm = false;
    buttonText = 'Save';
    buttonName = 'edit-save';

    generalInfoForm = this.fb.group({
        title: '',
        description: '',
        duration: 10,
    });

    constructor(
        private quizManagerService: NewQuizManagerService,
        private fb: FormBuilder,
    ) {}

    ngOnInit(): void {
        this.newQuiz = this.quizManagerService.getNewQuiz();
        this.quizManagerService.getQuizListFromServer();
    }
    toggleButtonTextAndName(): void {
        this.disableForm = !this.disableForm;
        this.buttonText = this.disableForm ? 'Edit' : 'Save';
        this.buttonName = this.disableForm ? 'save' : 'edit-save'; // Update the button name
    }

    getQuizList() {
        return this.quizManagerService.quizzes.getValue();
    }

    onSubmit() {
        this.newQuiz.title = this.generalInfoForm.value.title as string;
        this.newQuiz.description = this.generalInfoForm.value.description as string;
        this.newQuiz.duration = this.generalInfoForm.value.duration as number;
    }
}
