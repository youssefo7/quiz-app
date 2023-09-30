import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';

@Component({
    selector: 'app-create-game-list',
    templateUrl: './create-game-list.component.html',
    styleUrls: ['./create-game-list.component.scss'],
})
export class CreateGameListComponent implements OnInit {
    message: string;
    visibleQuizList: Quiz[];
    selectedQuizId: string | null;

    constructor(
        private readonly communicationService: CommunicationService,
        private router: Router,
        private popUp: MatDialog,
    ) {}

    ngOnInit(): void {
        this.getVisibleQuizListFromServer();
        this.message = '';
        this.visibleQuizList = [];
        this.selectedQuizId = null;
    }

    getVisibleQuizListFromServer() {
        this.communicationService.getQuizzes().subscribe((quizzes: Quiz[]) => {
            this.visibleQuizList = quizzes.filter((quiz) => quiz.visibility === true);
        });
    }

    toggleDetails(id: string): void {
        if (this.selectedQuizId === id) {
            this.selectedQuizId = null;
        } else {
            this.selectedQuizId = id;
        }
    }

    checkCanProceed(quiz: Quiz, toTest: boolean = false): void {
        this.communicationService.checkQuizAvailability(quiz.id).subscribe((isAvailable) => {
            if (isAvailable) {
                this.communicationService.checkQuizVisibility(quiz.id).subscribe((isVisible) => {
                    if (isVisible) {
                        if (toTest) this.router.navigate(['game/', quiz.id, 'test']);
                        else this.router.navigate(['waiting/']);
                    } else {
                        this.openHiddenPopUp();
                    }
                });
            } else {
                this.openUnavailablePopUp();
            }
        });
    }

    openUnavailablePopUp(): void {
        const config: PopupMessageConfig = {
            message: 'Le jeu a été supprimé. Veuillez en choisir un autre dans la liste.',
            hasCancelButton: false,
            okButtonFunction: () => {
                this.getVisibleQuizListFromServer();
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    openHiddenPopUp(): void {
        const config: PopupMessageConfig = {
            message: "Le jeu n'est plus disponible. Veuillez en choisir un autre dans la liste.",
            hasCancelButton: false,
            okButtonFunction: () => {
                this.getVisibleQuizListFromServer();
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }
}
