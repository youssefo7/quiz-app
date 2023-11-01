import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
    titleValue: string;
    descriptionValue: string;
    maxLengthTitle: number;
    maxLengthDescription: number;
    counterTitle: string;
    counterDescription: string;
    isTitleValid: boolean;
    isDescriptionValid: boolean;
    isDurationValid: boolean;
    private titleLength: number;
    private descriptionLength: number;

    constructor(
        private quizManagerService: QuizManagerService,
        private fb: FormBuilder,
    ) {
        this.isTitleValid = true;
        this.isDescriptionValid = true;
        this.isDurationValid = true;
        this.blockSubmit = new EventEmitter<boolean>();
    }

    ngOnInit() {
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

            this.blockSubmit.emit(false);
        }

        this.titleValue = this.generalInfoForm.controls.title.value;
        this.descriptionValue = this.generalInfoForm.controls.description.value;
        this.initCounters();
    }

    ngAfterViewInit() {
        this.generalInfoForm.valueChanges.subscribe(() => {
            if (this.generalInfoForm.valid) {
                this.blockSubmit.emit(false);
                this.quizManagerService.updateGeneralInfo(this.newQuiz, this.generalInfoForm);
            } else {
                this.blockSubmit.emit(true);
            }
        });
    }
    // characterCountValidator(maxLength: number): ValidatorFn {
    //     return (control: AbstractControl): ValidationErrors | null => {
    //         const value: string = control.value || '';
    //         const charCount = value.length;
    //         return charCount <= maxLength ? null : { characterCountExceeded: true };
    //     };
    // }

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

    adjustPadding() {
        const hasTitleBeenTouched = this.generalInfoForm.controls.title.dirty || this.generalInfoForm.controls.title.touched;
        this.isTitleValid = this.generalInfoForm.controls.title.invalid && hasTitleBeenTouched ? false : true;

        const hasDescriptionBeenTouched = this.generalInfoForm.controls.description.dirty || this.generalInfoForm.controls.description.touched;
        this.isDescriptionValid = this.generalInfoForm.controls.description.invalid && hasDescriptionBeenTouched ? false : true;

        this.isDurationValid = this.generalInfoForm.controls.duration.invalid ? false : true;
    }

    private initCounters() {
        this.maxLengthTitle = 150;
        this.maxLengthDescription = 300;

        this.titleLength = this.titleValue ? this.titleValue.length : 0;
        this.counterTitle = `${this.titleLength} / ${this.maxLengthTitle}`;

        this.descriptionLength = this.descriptionValue ? this.descriptionValue.length : 0;
        this.counterDescription = `${this.descriptionLength} / ${this.maxLengthDescription}`;
    }
}
