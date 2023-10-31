import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { JoinEvents } from '@app/events/join.events';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { SocketClientService } from '@app/services/socket-client.service';

@Component({
    selector: 'app-create-game-list',
    templateUrl: './create-game-list.component.html',
    styleUrls: ['./create-game-list.component.scss'],
})
export class CreateGameListComponent implements OnInit {
    message: string;
    visibleQuizList: Quiz[];
    selectedQuizId: string | null;
    roomId: string;
    quizId: string;

    // Raison: J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private readonly communicationService: CommunicationService,
        private socketClientService: SocketClientService,
        private router: Router,
        private popUp: MatDialog,
    ) {
        this.message = '';
        this.visibleQuizList = [];
        this.selectedQuizId = null;
        this.roomId = '';
    }

    ngOnInit(): void {
        this.getVisibleQuizListFromServer();
        this.socketClientService.connect();
        this.listenToSocketEvents();
    }

    listenToSocketEvents() {
        this.socketClientService.on(JoinEvents.CreateRoom, (roomId: string) => {
            this.roomId = roomId;
            this.redirectHost(this.quizId);
        });
    }

    getVisibleQuizListFromServer() {
        this.communicationService.getQuizzes().subscribe((quizzes: Quiz[]) => {
            this.visibleQuizList = quizzes.filter((quiz) => quiz.visibility);
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
                        else {
                            this.socketClientService.send('createRoom', quiz.id);
                            this.quizId = quiz.id;
                        }
                    } else {
                        this.openHiddenPopUp();
                    }
                });
            } else {
                this.openUnavailablePopUp();
            }
        });
    }

    redirectHost(quizId: string): void {
        this.router.navigateByUrl(`/waiting/game/${quizId}/room/${this.roomId}/host`);
        /* this.socketClientService.send('SuccessfulJoinHost', {
            roomId: this.roomId,
            name: 'Organisateur',
        }); */
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
