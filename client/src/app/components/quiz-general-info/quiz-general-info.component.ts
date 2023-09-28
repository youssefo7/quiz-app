import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';

@Component({
    selector: 'app-quiz-general-info',
    templateUrl: './quiz-general-info.component.html',
    styleUrls: ['./quiz-general-info.component.scss'],
})
export class QuizGeneralInfoComponent implements OnInit {
    newQuiz: Quiz;
    generalInfoForm: FormGroup;
    disableForm: boolean;
    buttonText: string;
    buttonName: string;

    titleValue: string;
    descriptionValue: string;
    maxLengthTitle: number;
    maxLengthDescription: number;
    charCountTitle: number;
    charCountDescription: number;
    counterTitle: string;
    counterDescription: string;


    constructor(
        private quizManagerService: NewQuizManagerService,
        private fb: FormBuilder,
        private route: ActivatedRoute,
    ) {         
        this.initCounters();
        this.disableForm = false;
        this.buttonText = 'Sauvegarder';
        this.buttonName = 'edit-save';}

    ngOnInit(): void {
        const routeParams = this.route.snapshot.paramMap;
        const quizId = String(routeParams.get('id'));
        // this.newQuiz = this.quizManagerService.getNewQuiz();
        if(quizId === 'null') {
            this.generalInfoForm = this.fb.group({
                title: ['', [Validators.required, Validators.minLength(1)]],
                description: ['', [Validators.required, Validators.minLength(1)]],
                duration: [10, [Validators.min(10), Validators.max(60)]],
            });
            this.newQuiz = this.quizManagerService.getNewQuiz();
        }
            // console.log(this.newQuiz);
            // this.quizManagerService.getQuizById(quizId);
            // this.newQuiz = this.quizManagerService.getQuizToModify();
        // this.newQuiz = this.quizManagerService.getNewQuiz();
        this.initCounters();
        // this.generalInfoForm = this.fb.group({
        //     title: ['', [Validators.required, Validators.minLength(1)]],
        //     description: ['', [Validators.required, Validators.minLength(1)]],
        //     duration: [10, [Validators.min(10), Validators.max(60)]],
        // });

        this.disableForm = false;
        this.buttonText = 'Sauvegarder';
        this.buttonName = 'edit-save';
    }

    ngOnDestroy(): void {
        console.log("i was killed");
    }

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
        const title =  this.generalInfoForm.value.title as string;
        const description = this.generalInfoForm.value.description as unknown as string;
        const duration = this.generalInfoForm.value?.duration as number;
        this.quizManagerService.setGeneralInfoData(title, description, duration);
        // this.newQuiz.title = this.generalInfoForm.value.title as string;
        // this.newQuiz.description = this.generalInfoForm.value.description as unknown as string;
        // this.newQuiz.duration = this.generalInfoForm.value?.duration as number;
    }

    loadGeneralData(quiz: Quiz) {
        this.newQuiz = quiz;
        // this.titleValue = quiz.title;
        // this.descriptionValue = quiz.description;
        this.initCounters();
        this.quizManagerService.setGeneralInfoData(quiz.title, quiz.description, quiz.duration);

        // this.newQuiz.title = quiz.title;
        // this.newQuiz.description = quiz.description;
        // this.newQuiz.duration = quiz.duration;
        this.generalInfoForm.patchValue({
            title: this.newQuiz.title,
            description: this.newQuiz.description,
            duration: this.newQuiz.duration,
        });
    }
}
