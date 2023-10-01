import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ImportPopupComponent } from '@app/components/import-popup/import-popup.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { ImportService } from '@app/services/import.service';

@Component({
    selector: 'app-quiz-list',
    templateUrl: './quiz-list.component.html',
    styleUrls: ['./quiz-list.component.scss'],
})
export class QuizListComponent implements OnInit {
    @ViewChild('export') anchor: ElementRef<HTMLAnchorElement>;
    quizList: Quiz[];

    // Plus que 3 paramètres sont necessaires pour le fonctionnement de cette composante
    // eslint-disable-next-line max-params
    constructor(
        private communicationService: CommunicationService,
        private popup: MatDialog,
        private importService: ImportService,
        private router: Router,
    ) {
        this.quizList = [];
    }

    ngOnInit(): void {
        this.fetchQuizzes();
    }

    fetchQuizzes(): void {
        this.communicationService.getQuizzes().subscribe((quizzes: Quiz[]) => {
            this.quizList = quizzes;
        });
    }

    deleteQuiz(quiz: Quiz): void {
        this.communicationService.deleteQuiz(quiz.id).subscribe({
            next: () => {
                this.fetchQuizzes();
            },
            error: () => {
                this.openPopupWarning();
            },
        });
    }

    //  https://stackoverflow.com/questions/57922872/angular-save-blob-in-local-text-file
    exportQuiz(quiz: Quiz): void {
        const exportedQuiz = { ...quiz };
        delete exportedQuiz.visibility;
        const quizName: string = quiz.title;

        //  create blob file
        const blob = new Blob([JSON.stringify(exportedQuiz)], { type: 'application/json' });
        const blobUrl = window.URL.createObjectURL(blob);

        this.anchor.nativeElement.href = blobUrl;
        this.anchor.nativeElement.download = quizName;

        this.anchor.nativeElement.click();

        window.URL.revokeObjectURL(blobUrl);
    }

    toggleVisibility(quiz: Quiz): void {
        quiz.visibility = !quiz.visibility;
        this.communicationService.updateQuiz(quiz.id, quiz).subscribe();
    }

    openPopupDelete(quiz: Quiz): void {
        const config: PopupMessageConfig = {
            message: "Êtes-vous sûr de vouloir supprimer ce quiz? Cette action n'est pas réversible.",
            hasCancelButton: true,
            okButtonText: 'Supprimer',
            cancelButtonText: 'Annuler',
            okButtonFunction: () => {
                this.deleteQuiz(quiz);
            },
        };
        const dialogRef = this.popup.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    openPopupWarning(): void {
        const config: PopupMessageConfig = {
            message: 'Ce quiz a déjà été supprimé par un autre administrateur.',
            hasCancelButton: false,
            okButtonFunction: () => {
                this.fetchQuizzes();
            },
        };
        const dialogRef = this.popup.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    async handleImport(event: Event) {
        try {
            await this.importService.selectQuiz(event);
            await this.importService.importQuiz();
            this.importSuccessPopup();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Une erreur s'est produite.";
            this.popup.open(ImportPopupComponent, {
                data: { errorMessage },
            });
        } finally {
            this.importService.resetInput(event);
            this.fetchQuizzes();
        }
    }

    importSuccessPopup(): void {
        const config: PopupMessageConfig = {
            message: 'Importation réussie',
            hasCancelButton: false,
        };
        const dialogRef = this.popup.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    editQuiz(quiz: Quiz): void {
        this.communicationService.checkQuizAvailability(quiz.id).subscribe({
            next: (isAvailable: boolean) => {
                if (isAvailable) {
                    this.router.navigate([`/quiz/${quiz.id}`]);
                } else {
                    this.openPopupWarning();
                }
            },
        });
    }
}
