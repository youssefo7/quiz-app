import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationPopUpComponent } from '@app/components/confirmation-pop-up/confirmation-pop-up.component';
import { QuizGeneralInfoComponent } from '@app/components/quiz-general-info/quiz-general-info.component';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { Question, Quiz } from '@app/interfaces/quiz';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';

@Component({
    selector: 'app-create-quiz-form',
    templateUrl: './create-quiz-form.component.html',
    styleUrls: ['./create-quiz-form.component.scss'],
})
export class CreateQuizFormComponent implements OnInit{
    // , AfterViewInit 
    @ViewChild(QuizQuestionInfoComponent, { static: false }) quizQuestionInfo: QuizQuestionInfoComponent;
    @ViewChild(QuizGeneralInfoComponent, { static: false }) quizGeneralInfo: QuizGeneralInfoComponent;
    newQuiz: Quiz;
    modifyQuiz: Quiz;
    isQuizToModify: boolean;
    quizId: string;

    constructor(
        private quizManagerService: NewQuizManagerService,
        // private route: ActivatedRoute,
        private confirmationDialogReference: MatDialog,
    ) {}

    ngOnInit(): void {
        // this.quizManagerService.getQuizListFromServer();
        // const routeParams = this.route.snapshot.paramMap;
        // const quizId = String(routeParams.get('id'));
        // if(quizId !== 'null') {
        //     this.quizManagerService.getQuizById(quizId);
        // }
        // this.newQuiz = this.quizManagerService.getNewQuiz();
        
        // console.log(this.newQuiz);
    }

    // ngAfterViewInit(): void {
        // if (this.quizId !== null) {
        //     this.quizManagerService.getQuizById(this.quizId);
        //     this.newQuiz = this.quizManagerService.getQuizToModify();
        //     this.quizManagerService.isQuizBeingModified = true;
        //     if (this.modifyQuiz.title !== '') {
        //         this.newQuiz = this.modifyQuiz;
        //         this.quizManagerService.setQuizToModify(this.newQuiz);
        //         this.quizGeneralInfo.loadGeneralData(this.newQuiz);
        //         this.quizQuestionInfo.loadQuestionData(this.newQuiz);
        //         this.isQuizToModify = true;
        //     }
        // } else {
        //     this.quizManagerService.getNewQuiz();
        //     this.isQuizToModify = false;
        // }
    // }

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
