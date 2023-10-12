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
    isGeneralInfoFormValid: boolean;
    quizToModify: Quiz;
    isQuizModified: boolean;

    constructor(
        private quizManagerService: QuizManagerService,
        private confirmationDialogReference: MatDialog,
        private route: ActivatedRoute,
    ) {
        this.isGeneralInfoFormValid = false;
        this.isQuizModified = false;
    }

    ngOnInit(): void {
        this.loadQuiz();
    }

    async loadQuiz(): Promise<void> {
        const id = this.route.snapshot.paramMap.get('id');
        const modifiedQuiz = await this.quizManagerService.fetchQuiz(id);
        this.newQuiz = modifiedQuiz ?? blankQuiz;
        this.pageTitle = this.newQuiz.id ? 'Modifier un jeu questionnaire' : 'Créer un jeu questionnaire';
        if (id !== '') {
            this.isQuizModified = false;
            this.quizToModify = this.quizManagerService.quizToModify;
        }
    }

    modifyQuestion(selectedQuestion: Question, selectedIndex: number) {
        this.quizQuestionInfo.loadQuestionInformation(selectedQuestion, selectedIndex);
    }

    onGeneralInfoChange(isFormValid: boolean): void {
        this.isGeneralInfoFormValid = isFormValid;
    }

    isQuizFormValid(): boolean {
        if (
            this.newQuiz &&
            this.newQuiz.questions.length > 0 &&
            this.newQuiz.questions.every((question) => this.isQuestionValid(question)) &&
            this.newQuiz.title.trim().length > 0 &&
            this.newQuiz.description.trim().length > 0 &&
            this.newQuiz.duration >= Constants.MIN_DURATION &&
            this.newQuiz.duration <= Constants.MAX_DURATION &&
            !this.isGeneralInfoFormValid
        ) {
            if (this.newQuiz.id !== '') {
                this.isQuizModified = this.hasQuizModified();
                return this.isQuizModified;
            } else {
                return true;
            }
        }

        this.isQuizModified = false;
        return false;
    }

    hasQuizModified(): boolean {
        if (
            this.quizToModify.title.trim() !== this.newQuiz.title.trim() ||
            this.quizToModify.description.trim() !== this.newQuiz.description.trim() ||
            this.quizToModify.duration !== this.newQuiz.duration
        ) {
            return true;
        }

        if (this.quizToModify.questions.length !== this.newQuiz.questions.length) {
            return true;
        }

        for (let i = 0; i < this.quizToModify.questions.length; i++) {
            if (
                this.quizToModify.questions[i].type !== this.newQuiz.questions[i].type ||
                this.quizToModify.questions[i].text.trim() !== this.newQuiz.questions[i].text.trim() ||
                this.quizToModify.questions[i].points !== this.newQuiz.questions[i].points ||
                this.quizToModify.questions[i].choices.length !== this.newQuiz.questions[i].choices.length
            ) {
                return true;
            }

            for (let j = 0; j < this.quizToModify.questions[i].choices.length; j++) {
                if (
                    this.quizToModify.questions[i].choices[j].text.trim() !== this.newQuiz.questions[i].choices[j].text.trim() ||
                    this.quizToModify.questions[i].choices[j].isCorrect !== this.newQuiz.questions[i].choices[j].isCorrect
                ) {
                    return true;
                }
            }
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
