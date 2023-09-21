import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

    descriptionValue: string = '';
    maxLength: number;
    charactersCount: number;
    counter: string;

    generalInfoForm = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(1)]],
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
        this.maxLength = 250;
        this.charactersCount = this.descriptionValue ? this.descriptionValue.length : 0;
        this.counter = `${this.charactersCount} / ${this.maxLength}`;
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

    onCharacterChange(event: Event) {
        const inputValue = (event.target as HTMLInputElement).value; // Get the value from the input element
        this.charactersCount = inputValue.length;
        this.counter = `${this.charactersCount} / ${this.maxLength}`;
    }
}
