import { Component, ElementRef, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { GameEvents } from '@app/events/game.events';
import { PlayerPoints } from '@app/interfaces/player-points';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss', '../../../assets/shared.scss'],
})
export class GamePageComponent implements OnInit {
    title: string;
    quiz: Quiz | null;
    playerPoints: number;
    playerName: string;
    readonly isTestGame: boolean;
    roomId: string | null;

    // Raison: J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private popup: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly elementRef: ElementRef,
        private readonly socketClientService: SocketClientService,
        private readonly roomCommunicationService: RoomCommunicationService,
        private readonly gameService: GameService,
    ) {
        this.title = 'Partie: ';
        this.playerPoints = 0;
        this.isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
        this.roomId = this.route.snapshot.paramMap.get('roomId');
    }

    async ngOnInit() {
        this.loadQuiz();
        if (!this.isTestGame) {
            this.playerName = await firstValueFrom(
                this.roomCommunicationService.getPlayerName(this.roomId as string, { socketId: this.socketClientService.socket.id }),
            );
        }
    }

    async loadQuiz() {
        await this.getQuiz();
        this.getQuizTitle();
        if (!this.isTestGame) {
            this.socketClientServiceConfig();
        }
    }

    async getQuiz() {
        if (this.isTestGame) {
            const quizId = this.route.snapshot.paramMap.get('quizId');
            this.quiz = await this.gameService.getQuizById(quizId);
        } else {
            const roomId = this.route.snapshot.paramMap.get('roomId') as string;
            this.quiz = await firstValueFrom(this.roomCommunicationService.getRoomQuiz(roomId));
        }
    }

    getQuizTitle() {
        if (this.quiz) {
            this.title += this.quiz.title;
            this.title += this.isTestGame ? ' (Test)' : '';
            this.elementRef.nativeElement.setAttribute('title', this.title);
        }
    }

    async leaveGamePage() {
        await this.router.navigateByUrl(this.isTestGame ? '/game/new' : '/home');
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

    private socketClientServiceConfig() {
        this.socketClientService.on(GameEvents.ShowResults, () => {
            this.router.navigateByUrl(`/results/game/${this.quiz?.id}/room/${this.roomId}`);
        });

        this.socketClientService.on(GameEvents.AddPointsToPlayer, (pointsObject: PlayerPoints) => {
            this.givePoints(pointsObject.pointsToAdd);
        });
    }
}
