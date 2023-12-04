import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { SocketDisconnectionService } from '@app/services/socket-disconnection.service';
import { GameEvents } from '@common/game.events';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-results-page',
    templateUrl: './results-page.component.html',
    styleUrls: ['./results-page.component.scss', '../../../assets/shared.scss'],
})
export class ResultsPageComponent implements OnInit, OnDestroy {
    roomId: string;
    quiz: Quiz;
    title: string;
    shouldHideResults: boolean;
    titleToggleButton: string;
    pageTitle: string;
    private isHost: boolean;

    // Tous ces paramètres sont nécessaires pour que la composante fonctionne bien
    // eslint-disable-next-line max-params
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private socketClientService: SocketClientService,
        private readonly socketDisconnectService: SocketDisconnectionService,
        private roomCommunicationService: RoomCommunicationService,
        private chartManagerService: ChartDataManagerService,
    ) {
        this.roomId = this.route.snapshot.paramMap.get('roomId') as string;
        this.title = 'Résultats';
        this.isHost = this.router.url.endsWith('/host');
        this.shouldHideResults = false;
        this.titleToggleButton = 'Afficher les statistiques de la partie';
        this.pageTitle = 'Scores des joueurs';
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
            isHost: this.isHost,
            gameAborted: false,
            isInGame: false,
        });
        this.quiz = await firstValueFrom(this.roomCommunicationService.getRoomQuiz(this.roomId));
    }

    toggleResultsDisplay() {
        this.shouldHideResults = !this.shouldHideResults;
        this.titleToggleButton = this.shouldHideResults ? 'Afficher les scores finaux des joueurs' : 'Afficher les statistiques de la partie';
        this.pageTitle = this.shouldHideResults ? 'Statistiques de la partie' : 'Scores des joueurs';
    }

    private handleNavigation() {
        if (this.isHost) {
            this.socketClientService.send(GameEvents.EndGame, { roomId: this.roomId, gameAborted: false });
            this.socketClientService.disconnect();
        } else {
            this.socketClientService.send(GameEvents.PlayerLeaveGame, { roomId: this.roomId, isInGame: false });
            this.socketClientService.disconnect();
        }
        this.chartManagerService.resetChartData();
    }
}
