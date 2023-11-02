import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { JoinEvents } from '@app/events/join.events';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-create-game-list',
    templateUrl: './create-game-list.component.html',
    styleUrls: ['./create-game-list.component.scss'],
})
export class CreateGameListComponent implements OnInit {
    message: string;
    visibleQuizList: Quiz[];
    selectedQuizId: string | null;

    // We need all these parameters for the constructor to work
    // eslint-disable-next-line max-params
    constructor(
        private readonly communicationService: CommunicationService,
        private readonly roomCommunicationService: RoomCommunicationService,
        private socketClientService: SocketClientService,
        private router: Router,
        private popUp: MatDialog,
    ) {
        this.message = '';
        this.visibleQuizList = [];
        this.selectedQuizId = null;
    }

    ngOnInit() {
        this.getVisibleQuizListFromServer();
    }

    toggleDetails(id: string) {
        this.selectedQuizId = this.selectedQuizId === id ? null : id;
    }

    canProceed(quiz: Quiz, toTest: boolean = false) {
        this.communicationService.checkQuizAvailability(quiz.id).subscribe((isAvailable) => {
            if (isAvailable) {
                this.communicationService.checkQuizVisibility(quiz.id).subscribe(async (isVisible) => {
                    if (isVisible) {
                        if (toTest) this.router.navigateByUrl(`game/${quiz.id}/test`);
                        else {
                            this.socketClientService.connect();
                            const roomId = await firstValueFrom(
                                this.roomCommunicationService.createRoom({
                                    quizId: quiz.id,
                                    socketId: this.socketClientService.socket.id,
                                }),
                            );
                            this.socketClientService.send(JoinEvents.JoinRoom, JSON.stringify(roomId));
                            this.router.navigateByUrl(`/waiting/game/${quiz.id}/room/${roomId}/host`);
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

    private getVisibleQuizListFromServer() {
        this.communicationService.getQuizzes().subscribe((quizzes: Quiz[]) => {
            this.visibleQuizList = quizzes.filter((quiz) => quiz.visibility);
        });
    }

    private openUnavailablePopUp() {
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

    private openHiddenPopUp() {
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
