import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { SocketDisconnectionService } from '@app/services/socket-disconnection.service';
import { GameEvents } from '@common/game.events';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-waiting-page',
    templateUrl: './waiting-page.component.html',
    styleUrls: ['./waiting-page.component.scss'],
})
export class WaitingPageComponent implements OnInit, OnDestroy {
    isHost: boolean;
    roomId: string;
    title: string;
    private players: string[];

    // Raison: J'injecte les services nécessaires dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private popUp: MatDialog,
        private socketClientService: SocketClientService,
        private socketDisconnectionService: SocketDisconnectionService,
        private roomCommunicationService: RoomCommunicationService,
    ) {
        this.players = [];
        this.isHost = this.route.snapshot.url.some((segment) => segment.path === 'host');
        this.roomId = this.route.snapshot.paramMap.get('roomId') as string;
    }

    @HostListener('window:beforeunload', ['$event'])
    beforeUnloadHandler() {
        this.handleNavigation();
    }

    ngOnDestroy() {
        this.handleNavigation();
    }

    async ngOnInit() {
        this.socketDisconnectionService.handleDisconnectEvent({
            roomId: this.roomId,
            isHost: this.isHost,
            isTestGame: false,
            gameAborted: true,
            isInGame: true,
            connectActions: async () => {
                this.listenToSocketEvents();
                this.players = await firstValueFrom(this.roomCommunicationService.getRoomPlayers(this.roomId));
                this.getQuizTitle(this.roomId);
            },
        });
    }

    quitPopUp() {
        if (!this.isHost) {
            this.playerQuitPopup();
        } else {
            this.hostQuitPopup();
        }
    }

    private handleNavigation() {
        const currentUrl = this.router.url;
        const gameUrl = `/game/${this.route.snapshot.paramMap.get('quizId')}/room/${this.roomId}`;
        if (this.isHost) {
            if (currentUrl !== gameUrl + '/host') {
                this.socketClientService.send(GameEvents.EndGame, { roomId: this.roomId, gameAborted: true });
            }
        } else {
            if (currentUrl !== gameUrl) {
                this.socketClientService.send(GameEvents.PlayerLeaveGame, { roomId: this.roomId, isInGame: true });
            }
        }
    }

    private listenToSocketEvents() {
        this.socketClientService.on(GameEvents.PlayerAbandonedGame, (name: string) => {
            this.removePlayer(name);
        });

        this.socketClientService.on(GameEvents.GameAborted, () => {
            this.gameEndsPopup();
        });
    }

    private async getQuizTitle(roomId: string) {
        const quiz = await firstValueFrom(this.roomCommunicationService.getRoomQuiz(roomId));
        if (quiz) {
            this.title = `Vue d'attente: ${quiz.title}`;
        }
    }

    private removePlayer(name: string) {
        this.players = this.players.filter((player) => player !== name);
    }

    private hostQuitPopup() {
        const config: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir quitter? Tous les joueurs seront exclus de la partie.',
            hasCancelButton: true,
            okButtonText: 'Quitter',
            okButtonFunction: () => {
                this.socketClientService.send(GameEvents.EndGame, { roomId: this.roomId, gameAborted: true });
                this.router.navigateByUrl('home/');
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    private playerQuitPopup() {
        const config: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir abandonner la partie?',
            hasCancelButton: true,
            okButtonText: 'Quitter',
            okButtonFunction: () => {
                this.socketClientService.send(GameEvents.PlayerLeaveGame, { roomId: this.roomId, isInGame: true });
                this.router.navigateByUrl('home/');
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    private gameEndsPopup() {
        const config: PopupMessageConfig = {
            message: "L'organisateur a quitté. La partie est terminée.",
            hasCancelButton: false,
            okButtonText: 'Quitter',
            okButtonFunction: () => {
                this.router.navigateByUrl('home/');
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }
}
