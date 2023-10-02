import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Quiz } from '@app/interfaces/quiz';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { Constants } from '@common/constants';

@Component({
    selector: 'app-quiz-general-info',
    templateUrl: './quiz-general-info.component.html',
    styleUrls: ['./quiz-general-info.component.scss'],
})
export class QuizGeneralInfoComponent implements OnInit, AfterViewInit {
    @Input() newQuiz: Quiz;
    @Output() blockSubmit: EventEmitter<boolean>;

    generalInfoForm: FormGroup;
    disableForm: boolean;
    buttonText: string;
    titleValue: string;
    descriptionValue: string;
    maxLengthTitle: number;
    maxLengthDescription: number;
    titleLength: number;
    descriptionLength: number;
    counterTitle: string;
    counterDescription: string;
    isTitleValid: boolean;
    isDescriptionValid: boolean;
    isDurationValid: boolean;

    constructor(
        private quizManagerService: QuizManagerService,
        private fb: FormBuilder,
    ) {
        this.isTitleValid = true;
        this.isDescriptionValid = true;
        this.isDurationValid = true;
        this.disableForm = false;
        this.buttonText = 'Sauvegarder';
        this.blockSubmit = new EventEmitter<boolean>();
    }

    ngOnInit(): void {
        if (this.newQuiz.id === '') {
            this.generalInfoForm = this.fb.group({
                title: ['', [Validators.required, Validators.minLength(1)]],
                description: ['', [Validators.required, Validators.minLength(1)]],
                duration: [Constants.MIN_DURATION, [Validators.min(Constants.MIN_DURATION), Validators.max(Constants.MAX_DURATION)]],
            });
        } else {
            this.generalInfoForm = this.fb.group({
                title: [this.newQuiz.title, [Validators.required, Validators.minLength(1)]],
                description: [this.newQuiz.description, [Validators.required, Validators.minLength(1)]],
                duration: [this.newQuiz.duration, [Validators.min(Constants.MIN_DURATION), Validators.max(Constants.MAX_DURATION)]],
            });

            this.blockSubmit.emit(true);
        }

        this.titleValue = this.generalInfoForm.controls.title.value;
        this.descriptionValue = this.generalInfoForm.controls.description.value;
        this.initCounters();
    }

    ngAfterViewInit(): void {
        if (this.newQuiz.id !== '') {
            setTimeout(() => {
                this.toggleButtonTextAndName();
            });
        }
    }

    initCounters() {
        this.maxLengthTitle = 150;
        this.maxLengthDescription = 300;

        this.titleLength = this.titleValue ? this.titleValue.length : 0;
        this.counterTitle = `${this.titleLength} / ${this.maxLengthTitle}`;

        this.descriptionLength = this.descriptionValue ? this.descriptionValue.length : 0;
        this.counterDescription = `${this.descriptionLength} / ${this.maxLengthDescription}`;
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
        this.blockSubmit.emit(!this.disableForm);
    }

    getQuizList() {
        return this.quizManagerService.quizzes;
    }

    onCharacterChangeTitle(event: Event) {
        const inputValue = (event.target as HTMLInputElement).value;
        this.titleLength = inputValue.length;
        this.counterTitle = `${this.titleLength} / ${this.maxLengthTitle}`;
    }

    onCharacterChangeDescription(event: Event) {
        const inputValue = (event.target as HTMLInputElement).value;
        this.descriptionLength = inputValue.length;
        this.counterDescription = `${this.descriptionLength} / ${this.maxLengthDescription}`;
    }

    onSubmit() {
        this.quizManagerService.updateGeneralInfo(this.newQuiz, this.generalInfoForm);
    }

    adjustPadding() {
        if (
            this.generalInfoForm.controls.title.invalid &&
            (this.generalInfoForm.controls.title.dirty || this.generalInfoForm.controls.title.touched)
        ) {
            this.isTitleValid = false;
        } else {
            this.isTitleValid = true;
        }

        if (
            this.generalInfoForm.controls.description.invalid &&
            (this.generalInfoForm.controls.description.dirty || this.generalInfoForm.controls.description.touched)
        ) {
            this.isDescriptionValid = false;
        } else {
            this.isDescriptionValid = true;
        }

        if (this.generalInfoForm.controls.duration.invalid) {
            this.isDurationValid = false;
        } else {
            this.isDurationValid = true;
        }
    }
}
