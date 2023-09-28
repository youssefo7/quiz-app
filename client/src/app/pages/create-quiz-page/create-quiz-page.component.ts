import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationPopUpComponent } from '@app/components/confirmation-pop-up/confirmation-pop-up.component';
import { QuizGeneralInfoComponent } from '@app/components/quiz-general-info/quiz-general-info.component';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { Question, Quiz } from '@app/interfaces/quiz';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';

@Component({
    selector: 'app-create-quiz-page',
    templateUrl: './create-quiz-page.component.html',
    styleUrls: ['./create-quiz-page.component.scss'],
})
export class CreateQuizPageComponent implements OnInit, OnDestroy {
    // AfterViewInit
    // quiz: Quiz;
    // constructor(private route: ActivatedRoute) {}
    // private quizManagerService: NewQuizManagerService
    // ngOnInit(): void {
    //     const routeParams = this.route.snapshot.paramMap;
    //     const quizId = String(routeParams.get('id'));
        // quizId !== null ? this.formTitle = "Créer jeu questionnaire" : this.formTitle="Modifier jeu questionnaire";
        // if(quizId !== 'null') {
        //     this.quizManagerService.getQuizById(quizId);
        // }
    // }
    @ViewChild(QuizQuestionInfoComponent, { static: false }) quizQuestionInfo: QuizQuestionInfoComponent;
    @ViewChild(QuizGeneralInfoComponent, { static: false }) quizGeneralInfo: QuizGeneralInfoComponent;
    newQuiz: Quiz;
    modifyQuiz: Quiz;
    isQuizToModify: boolean;
    quizId: string;
    formTitle: string;

    constructor(
        private quizManagerService: NewQuizManagerService,
        private route: ActivatedRoute,
        private confirmationDialogReference: MatDialog,
    ) {}

    async ngOnInit(): Promise<void> {
        const routeParams = this.route.snapshot.paramMap;
        console.log(routeParams, "route paramss");
        this.quizId = String(routeParams.get('id'));
        // this.quizId !== null ? this.formTitle = "Créer jeu questionnaire" : this.formTitle="Modifier jeu questionnaire";
        if (this.quizId !== 'null') {
            const quizObeservable = await this.quizManagerService.getQuizById(this.quizId);
            this.newQuiz = quizObeservable as Quiz;
            console.log("what");
            console.log(quizObeservable);
        }
        else {
            this.newQuiz = this.quizManagerService.getNewQuiz();
        }
        this.quizManagerService.setQuiz(this.newQuiz);
    }

    ngAfterViewInit(): void {
        if (this.newQuiz.id !== 'null') {
            this.quizGeneralInfo.loadGeneralData(this.newQuiz);
        }
    }


    ngOnDestroy(): void {
        console.log("i was killed");
    }


    modifyQuestion(selectedQuestion: Question, selectedIndex: number) {
        this.quizQuestionInfo.loadQuestionInformation(selectedQuestion, selectedIndex);
    }

    isQuizFormValid(): boolean {
        if (this.newQuiz.questions.every((question) => this.isQuestionValid(question)) && this.newQuiz.title !== '' && this.newQuiz.duration !== 0) {
            return true;
        }
        return false;
    }

    isQuestionValid(question: Question): boolean {
        return (
            question.text.trim().length > 0 &&
            question.type.trim().length > 0 &&
            question.choices.length >= 2 &&
            question.choices.some((choice) => choice.text.trim().length > 0) &&
            question.choices.some((choice) => choice.isCorrect)
        );
    }

    deleteQuestion(index: number): void {
        if (index >= 0 && index < this.newQuiz.questions.length) {
            this.newQuiz.questions.splice(index, 1);
        }
    }

    moveQuestionUp(index: number) {
        this.quizManagerService.moveQuestionUp(index);
    }

    moveQuestionDown(index: number) {
        this.quizManagerService.moveQuestionDown(index);
    }

    openQuizConfirmation(): void {
        const quizConfirmationDialogReference = this.confirmationDialogReference.open(ConfirmationPopUpComponent);
        quizConfirmationDialogReference.componentInstance.setConfirmationText("Sauvegarder cette question?");

        quizConfirmationDialogReference.afterClosed().subscribe((result) => {
            if (result) {
                this.saveQuiz();
            }
        })
    }

    saveQuiz() {
        this.quizManagerService.saveQuiz(this.newQuiz.id, this.newQuiz, this.isQuizToModify);
    }
}
