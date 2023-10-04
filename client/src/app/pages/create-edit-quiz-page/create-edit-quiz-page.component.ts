import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationPopupComponent } from '@app/components/confirmation-popup/confirmation-popup.component';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { Question, Quiz } from '@app/interfaces/quiz';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { Constants } from '@common/constants';
import { blankQuiz } from './utils';

@Component({
    selector: 'app-create-edit-quiz-page',
    templateUrl: './create-edit-quiz-page.component.html',
    styleUrls: ['./create-edit-quiz-page.component.scss'],
})
export class CreateEditQuizPageComponent implements OnInit {
    @ViewChild(QuizQuestionInfoComponent, { static: false }) quizQuestionInfo: QuizQuestionInfoComponent;

    newQuiz: Quiz;
    quizId: string;
    pageTitle: string;
    resetQuiz: Quiz;
    shouldDisableForm: boolean;

    constructor(
        private quizManagerService: QuizManagerService,
        private confirmationDialogReference: MatDialog,
        private route: ActivatedRoute,
    ) {
        this.shouldDisableForm = false;
    }

    ngOnInit(): void {
        this.loadQuiz();
    }

    async loadQuiz(): Promise<void> {
        const id = this.route.snapshot.paramMap.get('id');
        const modifiedQuiz = await this.quizManagerService.fetchQuiz(id);
        this.newQuiz = modifiedQuiz ?? blankQuiz;
        this.pageTitle = this.newQuiz.id ? 'Modifier un jeu questionnaire' : 'Créer un jeu questionnaire';
    }

    modifyQuestion(selectedQuestion: Question, selectedIndex: number) {
        this.quizQuestionInfo.loadQuestionInformation(selectedQuestion, selectedIndex);
    }

    onGeneralInfoChange(shouldDisableForm: boolean): void {
        this.shouldDisableForm = shouldDisableForm;
    }

    isQuizFormValid(): boolean {
        if (
            this.newQuiz &&
            this.newQuiz.questions.length > 0 &&
            this.newQuiz.questions.every((question) => this.isQuestionValid(question)) &&
            this.newQuiz.title.trim().length > 0 &&
            this.newQuiz.description.trim().length > 0 &&
            this.newQuiz.duration >= Constants.MIN_DURATION &&
            !this.shouldDisableForm
        ) {
            return true;
        }
        return false;
    }

    isQuestionValid(question: Question): boolean {
        return (
            question.text.trim().length > 0 &&
            question.type.trim().length > 0 &&
            question.choices.length >= Constants.MIN_CHOICES &&
            question.choices.some((choice) => choice.text.trim().length > 0) &&
            question.choices.some((choice) => choice.isCorrect)
        );
    }

    deleteQuestion(index: number): void {
        this.quizManagerService.deleteQuestion(index, this.newQuiz);
        if (this.quizManagerService.modifiedIndex === index && this.quizManagerService.isModifiedQuestion) {
            this.quizQuestionInfo.resetForm();
            this.quizManagerService.isModifiedQuestion = false;
        }
    }

    moveQuestionUp(index: number) {
        this.quizManagerService.moveQuestionUp(index, this.newQuiz);
    }

    moveQuestionDown(index: number) {
        this.quizManagerService.moveQuestionDown(index, this.newQuiz);
    }

    openQuizConfirmation(): void {
        const quizConfirmationDialogReference = this.confirmationDialogReference.open(ConfirmationPopupComponent);
        quizConfirmationDialogReference.componentInstance.setConfirmationText('Sauvegarder ce quiz?');

        quizConfirmationDialogReference.afterClosed().subscribe((wantsToSave) => {
            if (wantsToSave) {
                this.saveQuiz();
            }
        });
    }

    saveQuiz() {
        if (this.newQuiz) {
            this.quizManagerService.saveQuiz(this.newQuiz);
        }
    }
}
