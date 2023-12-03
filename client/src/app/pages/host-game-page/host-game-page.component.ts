import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { SocketDisconnectionService } from '@app/services/socket-disconnection.service';
import { GameEvents } from '@common/game.events';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-host-game-page',
    templateUrl: './host-game-page.component.html',
    styleUrls: ['./host-game-page.component.scss', '../../../assets/shared.scss'],
})
export class HostGamePageComponent implements OnInit, OnDestroy {
    quiz: Quiz;
    title: string;
    roomId: string;

    // Raison: J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private popup: MatDialog,
        private roomCommunicationService: RoomCommunicationService,
        private socketClientService: SocketClientService,
        private readonly socketDisconnectService: SocketDisconnectionService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
    ) {
        this.title = 'Partie: ';
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
        this.socketDisconnectService.handleDisconnectEvent({
            roomId: this.roomId,
            isHost: true,
            gameAborted: true,
            initialization: async () => {
                this.loadQuiz();
            },
        });
    }

    openQuitPopUp() {
        const config: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir quitter la partie? La partie sera terminée pour tous les joueurs.',
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

    private async loadQuiz() {
        await this.getQuiz();
        this.getQuizTitle();
    }

    private async getQuiz() {
        this.roomId = this.route.snapshot.paramMap.get('roomId') as string;
        this.quiz = await firstValueFrom(this.roomCommunicationService.getRoomQuiz(this.roomId));
    }

    private getQuizTitle() {
        if (this.quiz) {
            this.title += this.quiz.title;
            this.title += ' (Organisateur)';
        }
    }

    private async leaveGamePage() {
        await this.router.navigateByUrl('/game/new');
    }

    private handleNavigation() {
        const currentUrl = this.router.url;
        const gameUrl = `/results/game/${this.route.snapshot.paramMap.get('quizId')}/room/${this.roomId}/host`;
        if (currentUrl !== gameUrl) {
            this.socketClientService.send(GameEvents.EndGame, { roomId: this.roomId, gameAborted: true });
            this.socketClientService.disconnect();
        }
    }
}
