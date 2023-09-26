import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
    modifyQuiz: Quiz;

    disableForm = false;
    buttonText = 'Sauvegarder';
    buttonName = 'edit-save';

    titleValue: string = '';
    descriptionValue: string = '';
    maxLengthTitle: number;
    maxLengthDescription: number;
    charCountTitle: number;
    charCountDescription: number;
    counterTitle: string;
    counterDescription: string;

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
        this.quizManagerService.getQuizListFromServer();
        this.newQuiz = this.quizManagerService.getNewQuiz();
        this.initCounters();
    }

    initCounters() {
        this.maxLengthTitle = 75;
        this.maxLengthDescription = 250;

        this.charCountTitle = this.titleValue ? this.titleValue.length : 0;
        this.counterTitle = `${this.charCountTitle} / ${this.maxLengthTitle}`;

        this.charCountDescription = this.descriptionValue ? this.descriptionValue.length : 0;
        this.counterDescription = `${this.charCountDescription} / ${this.maxLengthDescription}`;
    }

    characterCountValidator(maxLength: number): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value: string = control.value || '';
            const charCount = value.length;
            return charCount <= maxLength ? null : { characterCountExceeded: true };
        };
    }

    toggleButtonTextAndName(): void {
        this.disableForm = !this.disableForm;
        this.buttonText = this.disableForm ? 'Modifier' : 'Sauvegarder';
        this.buttonName = this.disableForm ? 'edit-save' : 'save';
    }

    getQuizList() {
        return this.quizManagerService.quizzes.getValue();
    }

    onCharacterChangeTitle(event: Event) {
        const inputValue = (event.target as HTMLInputElement).value;
        this.charCountTitle = inputValue.length;
        this.counterTitle = `${this.charCountTitle} / ${this.maxLengthTitle}`;
    }

    onCharacterChangeDescription(event: Event) {
        const inputValue = (event.target as HTMLInputElement).value;
        this.charCountDescription = inputValue.length;
        this.counterDescription = `${this.charCountDescription} / ${this.maxLengthDescription}`;
    }

    onSubmit() {
        this.newQuiz.title = this.generalInfoForm.value.title as string;
        this.newQuiz.description = this.generalInfoForm.value.description as unknown as string;
        this.newQuiz.duration = this.generalInfoForm.value?.duration as number;
    }

    loadGeneralData(quiz: Quiz) {
        this.newQuiz.title = quiz.title;
        this.newQuiz.description = quiz.description;
        this.newQuiz.duration = quiz.duration;
        this.generalInfoForm.patchValue({
            title: this.newQuiz.title,
            description: this.newQuiz.description,
            duration: this.newQuiz.duration,
        });
    }
}
