import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { SocketDisconnectionService } from '@app/services/socket-disconnection.service';
import { Constants } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { PlayerPoints } from '@common/player-points';
import { TimeEvents } from '@common/time.events';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss', '../../../assets/shared.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    title: string;
    quiz: Quiz | null;
    playerPoints: number;
    playerName: string;
    roomId: string;
    readonly isTestGame: boolean;
    private panicAudio: HTMLAudioElement;

    // J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private popup: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly socketClientService: SocketClientService,
        private readonly socketDisconnectService: SocketDisconnectionService,
        private readonly roomCommunicationService: RoomCommunicationService,
        private readonly communicationService: CommunicationService,
    ) {
        this.title = 'Partie: ';
        this.playerPoints = 0;
        this.isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
        this.roomId = this.route.snapshot.paramMap.get('roomId') as string;
        this.panicAudio = new Audio(Constants.AUDIO);
    }

    @HostListener('window:beforeunload', ['$event'])
    beforeUnloadHandler() {
        if (!this.isTestGame) {
            this.handleNavigation();
        }
    }

    ngOnDestroy() {
        if (!this.isTestGame) {
            this.handleNavigation();
        }
    }

    async ngOnInit() {
        this.socketDisconnectService.handleDisconnectEvent({
            roomId: this.roomId,
            isHost: false,
            isTestGame: this.isTestGame,
            isInGame: true,
            connectActions: async () => {
                this.loadQuiz();
                if (!this.isTestGame) {
                    this.playerName = await firstValueFrom(
                        this.roomCommunicationService.getPlayerName(this.roomId as string, { socketId: this.socketClientService.socket.id }),
                    );
                }
            },
        });
    }

    givePoints(points: number) {
        this.playerPoints += points;
    }

    openQuitPopUp() {
        const config: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir quitter la partie? Vous ne pourrez plus rejoindre cette partie.',
            hasCancelButton: true,
            okButtonText: 'Quitter',
            okButtonFunction: () => {
                this.leaveGamePage();
            },
        };
        const dialogRef = this.popup.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    private playPanicModeSound() {
        this.panicAudio.play();
    }

    private async loadQuiz() {
        await this.getQuiz();
        this.getQuizTitle();
        if (!this.isTestGame) {
            this.socketClientServiceConfig();
        }
    }

    private async getQuiz() {
        if (this.isTestGame) {
            const quizId = this.route.snapshot.paramMap.get('quizId') as string;
            this.quiz = await firstValueFrom(this.communicationService.getQuiz(quizId));
        } else {
            const roomId = this.route.snapshot.paramMap.get('roomId') as string;
            this.quiz = await firstValueFrom(this.roomCommunicationService.getRoomQuiz(roomId));
        }
    }

    private getQuizTitle() {
        if (this.quiz) {
            this.title += this.quiz.title;
            this.title += this.isTestGame ? ' (Test)' : '';
        }
    }

    private handleNavigation() {
        const currentUrl = this.router.url;
        const gameUrl = `/results/game/${this.route.snapshot.paramMap.get('quizId')}/room/${this.roomId}`;
        if (currentUrl !== gameUrl) {
            this.socketClientService.send(GameEvents.PlayerLeaveGame, { roomId: this.roomId, isInGame: true }, () => {
                this.socketClientService.disconnect();
            });
        }
    }

    private async leaveGamePage() {
        await this.router.navigateByUrl(this.isTestGame ? '/game/new' : '/home');
    }

    private socketClientServiceConfig() {
        this.socketClientService.on(GameEvents.ShowResults, () => {
            this.router.navigateByUrl(`/results/game/${this.quiz?.id}/room/${this.roomId}`);
        });

        this.socketClientService.on(GameEvents.AddPointsToPlayer, (pointsObject: PlayerPoints) => {
            this.givePoints(pointsObject.pointsToAdd);
        });

        this.socketClientService.on(TimeEvents.PanicMode, () => {
            this.playPanicModeSound();
        });
    }
}
