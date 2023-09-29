import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Quiz } from '@app/interfaces/quiz';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';
import { Constants } from '@common/constants';

@Component({
    selector: 'app-quiz-general-info',
    templateUrl: './quiz-general-info.component.html',
    styleUrls: ['./quiz-general-info.component.scss'],
})
export class QuizGeneralInfoComponent implements OnInit {
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
        private quizManagerService: NewQuizManagerService,
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
        /* const routeParams = this.route.snapshot.paramMap;
        const quizId = String(routeParams.get('id'));
        // this.newQuiz = this.quizManagerService.getNewQuiz();
        if (quizId === 'null') {
            this.generalInfoForm = this.fb.group({
                title: ['', [Validators.required, Validators.minLength(1)]],
                description: ['', [Validators.required, Validators.minLength(1)]],
                duration: [10, [Validators.min(10), Validators.max(60)]],
            });
            this.newQuiz = this.quizManagerService.newQuiz;
        } */
        // console.log(this.newQuiz);
        // this.quizManagerService.getQuizById(quizId);
        // this.newQuiz = this.quizManagerService.getQuizToModify();
        // this.newQuiz = this.quizManagerService.getNewQuiz();
        // this.initCounters();
        // this.generalInfoForm = this.fb.group({
        //     title: ['', [Validators.required, Validators.minLength(1)]],
        //     description: ['', [Validators.required, Validators.minLength(1)]],
        //     duration: [10, [Validators.min(10), Validators.max(60)]],
        // });

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
        }

        this.initCounters();
    }

    /*     ngOnDestroy(): void {
        console.log('i was killed');
    } */

    // ngAfterViewInit(): void {
    //     this.generalInfoForm.patchValue({
    //         title: this.newQuiz.title,
    //         description: this.newQuiz.description,
    //         duration: this.newQuiz.duration,
    //     });
    // }

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
        const title = this.generalInfoForm.value.title as string;
        const description = this.generalInfoForm.value.description as string;
        const duration = this.generalInfoForm.value?.duration as number;
        this.quizManagerService.updateGeneralInfo(this.newQuiz, title, description, duration);
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

    // loadGeneralData(quiz: Quiz) {
    //     this.newQuiz = quiz;
    //     // this.titleValue = quiz.title;
    //     // this.descriptionValue = quiz.description;
    //     this.initCounters();
    //     this.quizManagerService.setGeneralInfoData(quiz.title, quiz.description, quiz.duration);

    //     // this.newQuiz.title = quiz.title;
    //     // this.newQuiz.description = quiz.description;
    //     // this.newQuiz.duration = quiz.duration;
    //     this.generalInfoForm.patchValue({
    //         title: this.newQuiz.title,
    //         description: this.newQuiz.description,
    //         duration: this.newQuiz.duration,
    //     });
    // }
}
