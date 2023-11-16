import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ImportPopupComponent } from '@app/components/import-popup/import-popup.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { ImportService } from '@app/services/import.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-quiz-list',
    templateUrl: './quiz-list.component.html',
    styleUrls: ['./quiz-list.component.scss'],
})
export class QuizListComponent implements OnInit {
    @ViewChild('export') anchor: ElementRef<HTMLAnchorElement>;
    quizzes: Quiz[];
    private message: string;

    // Ces services injectés sont nécessaires
    // eslint-disable-next-line max-params
    constructor(
        private communicationService: CommunicationService,
        private popup: MatDialog,
        private importService: ImportService,
        private router: Router,
    ) {
        this.quizzes = [];
    }

    async ngOnInit(): Promise<void> {
        await this.fetchQuizzes();
    }

    //  https://stackoverflow.com/questions/57922872/angular-save-blob-in-local-text-file
    exportQuiz(quiz: Quiz) {
        const exportedQuiz = { ...quiz };
        delete exportedQuiz.visibility;
        const quizName: string = quiz.title;

        const blob = new Blob([JSON.stringify(exportedQuiz, null, 2)], { type: 'application/json' });
        const blobUrl = window.URL.createObjectURL(blob);

        this.anchor.nativeElement.href = blobUrl;
        this.anchor.nativeElement.download = quizName;

        this.anchor.nativeElement.click();

        window.URL.revokeObjectURL(blobUrl);
    }

    async toggleVisibility(quiz: Quiz): Promise<void> {
        quiz.visibility = !quiz.visibility;
        await firstValueFrom(this.communicationService.updateQuiz(quiz.id, quiz));
    }

    openPopupDelete(quiz: Quiz) {
        const config: PopupMessageConfig = {
            message: "Êtes-vous sûr de vouloir supprimer ce quiz? Cette action n'est pas réversible.",
            hasCancelButton: true,
            okButtonText: 'Supprimer',
            cancelButtonText: 'Annuler',
            okButtonFunction: async () => {
                await this.deleteQuiz(quiz);
            },
        };
        const dialogRef = this.popup.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    async handleImport(event: Event) {
        try {
            this.importService.selectQuiz(event);
            await this.importService.importQuiz();
            this.importSuccessPopup();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Une erreur s'est produite.";
            this.popup.open(ImportPopupComponent, {
                data: { errorMessage },
            });
        } finally {
            this.importService.resetInput(event);
            await this.fetchQuizzes();
        }
    }

    importSuccessPopup() {
        const config: PopupMessageConfig = {
            message: 'Importation réussie',
            hasCancelButton: false,
        };
        const dialogRef = this.popup.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    async editQuiz(quiz: Quiz): Promise<void> {
        const isQuizAvailable = await firstValueFrom(this.communicationService.checkQuizAvailability(quiz.id));

        if (isQuizAvailable) {
            this.router.navigate([`/quiz/${quiz.id}`]);
        } else {
            this.message = 'Le quiz que vous souhaitez modifier a été supprimé.';
            this.openPopupWarning(this.message);
        }
    }

    private async fetchQuizzes(): Promise<void> {
        this.quizzes = await firstValueFrom(this.communicationService.getQuizzes());
    }

    private async deleteQuiz(quiz: Quiz): Promise<void> {
        try {
            await firstValueFrom(this.communicationService.deleteQuiz(quiz.id));
            await this.fetchQuizzes();
        } catch (error) {
            this.message = 'Ce quiz a déjà été supprimé par un autre administrateur.';
            this.openPopupWarning(this.message);
        }
    }

    private openPopupWarning(message: string) {
        const config: PopupMessageConfig = {
            message,
            hasCancelButton: false,
            okButtonFunction: async () => {
                await this.fetchQuizzes();
            },
        };
        const dialogRef = this.popup.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }
}
