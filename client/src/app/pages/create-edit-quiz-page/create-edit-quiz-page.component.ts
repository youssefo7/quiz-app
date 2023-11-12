import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, CanDeactivateFn } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Question, Quiz } from '@app/interfaces/quiz';
import { AdminGuardService } from '@app/services/admin-guard.service';
import { QuizManagerService } from '@app/services/quiz-manager.service';
import { firstValueFrom } from 'rxjs';
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
    canExitCreateEditQuizPage: boolean;
    isQuizSaved: boolean;

    // 4 paramètres sont nécessaires pour le constructeur
    // eslint-disable-next-line max-params
    constructor(
        private quizManagerService: QuizManagerService,
        private confirmationDialogReference: MatDialog,
        private route: ActivatedRoute,
        private adminGuardService: AdminGuardService,
    ) {
        this.isGeneralInfoFormValid = false;
        this.canExitCreateEditQuizPage = false;
        this.isQuizSaved = false;
    }

    async ngOnInit() {
        await this.loadQuiz();
        this.adminGuardService.grantAccess();
    }

    async loadQuiz(): Promise<void> {
        const id = this.route.snapshot.paramMap.get('id');
        const modifiedQuiz = await this.quizManagerService.fetchQuiz(id);
        this.newQuiz = modifiedQuiz ?? JSON.parse(JSON.stringify(blankQuiz));
        this.pageTitle = this.newQuiz.id ? 'Modifier un jeu questionnaire' : 'Créer un jeu questionnaire';
    }

    modifyQuestion(selectedQuestion: Question, selectedIndex: number) {
        this.quizQuestionInfo.loadQuestionInformation(selectedQuestion, selectedIndex);
    }

    setIsGeneralInfoFormValid(shouldBlockSubmit: boolean) {
        this.isGeneralInfoFormValid = !shouldBlockSubmit;
    }

    isQuizFormValid() {
        if (this.newQuiz.questions.length > 0 && this.isGeneralInfoFormValid) {
            return this.newQuiz.id !== '' ? this.quizManagerService.hasQuizBeenModified(this.newQuiz) : true;
        }
        return false;
    }

    deleteQuestion(index: number) {
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

    openQuizConfirmation() {
        const config: PopupMessageConfig = {
            message: 'Sauvegarder ce quiz?',
            hasCancelButton: true,
            cancelButtonText: 'Non',
            okButtonText: 'Oui',
            okButtonFunction: async () => {
                await this.saveQuiz();
            },
        };
        const dialogRef = this.confirmationDialogReference.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    async openPageExitConfirmation(): Promise<boolean> {
        const config: PopupMessageConfig = {
            message: 'Quitter la page? Toutes les informations non enregistrées seront supprimées',
            hasCancelButton: true,
            cancelButtonText: 'Annuler',
            okButtonText: 'Quitter',
            okButtonFunction: () => {
                this.canExitCreateEditQuizPage = true;
            },
        };
        const dialogRef = this.confirmationDialogReference.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;

        await firstValueFrom(dialogRef.afterClosed());
        return this.canExitCreateEditQuizPage;
    }

    async saveQuiz() {
        if (this.newQuiz) {
            this.isQuizSaved = true;
            await this.quizManagerService.saveQuiz(this.newQuiz);
        }
    }
}

export const exitCreateEditQuizPageGuard: CanDeactivateFn<CreateEditQuizPageComponent> = async (component: CreateEditQuizPageComponent) => {
    if (component.isQuizSaved) return true;
    return await component.openPageExitConfirmation();
};
