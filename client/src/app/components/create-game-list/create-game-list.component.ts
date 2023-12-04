import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { NewRoomResponse } from '@app/interfaces/join-room-response';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { JoinEvents } from '@common/join.events';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-create-game-list',
    templateUrl: './create-game-list.component.html',
    styleUrls: ['./create-game-list.component.scss'],
})
export class CreateGameListComponent implements OnInit, OnDestroy {
    message: string;
    visibleQuizList: Quiz[];
    selectedQuizId: string | null;

    // Raison: J'injecte les services nécessaires dans mon constructeur
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

    async ngOnInit(): Promise<void> {
        await this.getVisibleQuizListFromServer();
        this.socketClientService.connect();
    }

    ngOnDestroy() {
        const currentUrl = this.router.url;
        if (!currentUrl.includes('waiting')) {
            this.socketClientService.disconnect();
        }
    }

    toggleDetails(id: string) {
        if (this.selectedQuizId === id) {
            this.selectedQuizId = null;
        } else {
            this.selectedQuizId = id;
        }
    }

    async checkAndCreateRoom(quiz: Quiz, toTest: boolean = false) {
        const isQuizAvailable = await firstValueFrom(this.communicationService.checkQuizAvailability(quiz.id));

        if (isQuizAvailable) {
            const isQuizVisible = await firstValueFrom(this.communicationService.checkQuizVisibility(quiz.id));

            if (isQuizVisible) {
                if (toTest) {
                    this.router.navigateByUrl(`game/${quiz.id}/test`);
                } else {
                    if (this.socketClientService.socketExists()) {
                        const newRoomResponse: NewRoomResponse = await firstValueFrom(
                            this.roomCommunicationService.createRoom({
                                quiz: this.findSelectedQuizInVisibleList() as Quiz,
                                socketId: this.socketClientService.socket.id,
                            }),
                        );
                        const roomId = '' + newRoomResponse.roomId;
                        this.socketClientService.send(JoinEvents.OrganizerJoined, roomId);
                        this.router.navigateByUrl(`/waiting/game/${this.selectedQuizId}/room/${roomId}/host`);
                    } else {
                        this.openConnectionPopUp();
                    }
                }
            } else {
                this.openHiddenPopUp();
            }
        } else {
            this.openUnavailablePopUp();
        }
    }

    openUnavailablePopUp() {
        const config: PopupMessageConfig = {
            message: 'Le jeu a été supprimé. Veuillez en choisir un autre dans la liste.',
            hasCancelButton: false,
            okButtonFunction: async () => {
                await this.getVisibleQuizListFromServer();
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    private openConnectionPopUp() {
        const config: PopupMessageConfig = {
            message: "Vous n'êtes pas connecté. Veuillez réessayer.",
            hasCancelButton: false,
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    private openHiddenPopUp() {
        const config: PopupMessageConfig = {
            message: "Le jeu n'est plus disponible. Veuillez en choisir un autre dans la liste.",
            hasCancelButton: false,
            okButtonFunction: async () => {
                await this.getVisibleQuizListFromServer();
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    private async getVisibleQuizListFromServer(): Promise<void> {
        const quizzes = await firstValueFrom(this.communicationService.getQuizzes());
        this.visibleQuizList = quizzes.filter((quiz) => quiz.visibility);
    }

    private findSelectedQuizInVisibleList(): Quiz | undefined {
        return this.visibleQuizList.find((quiz) => quiz.id === this.selectedQuizId);
    }
}
