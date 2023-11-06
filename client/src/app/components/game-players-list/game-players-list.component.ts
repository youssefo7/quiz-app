import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameEvents } from '@app/events/game.events';
import { PlayerInfo } from '@app/interfaces/player-info';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { firstValueFrom } from 'rxjs';

interface AddPointsResponse {
    pointsToAdd: number;
    name: string;
}

@Component({
    selector: 'app-game-players-list',
    templateUrl: './game-players-list.component.html',
    styleUrls: ['./game-players-list.component.scss'],
})
export class GamePlayersListComponent implements OnInit {
    playersList: PlayerInfo[];
    private isResultsRoute: boolean;

    // Raison: Nous avons besoin de 4 d'injecter 4 objets dans cette classe
    // eslint-disable-next-line max-params
    constructor(
        private socketService: SocketClientService,
        private roomCommunicationService: RoomCommunicationService,
        private router: Router,
        private route: ActivatedRoute,
    ) {
        this.isResultsRoute = this.router.url.includes('results');
        this.playersList = [];
    }

    async ngOnInit() {
        await this.fetchPlayersList();
        const canSort = this.isResultsRoute && this.playersList.length > 0;
        if (canSort) {
            this.sortPlayers();
        }
        this.listenToSocketEvents();
    }

    async fetchPlayersList() {
        const roomId = this.route.snapshot.paramMap.get('roomId') as string;
        const roomPlayersObservable = this.roomCommunicationService.getRoomPlayers(roomId);

        if (roomPlayersObservable) {
            const roomPlayers = await firstValueFrom(roomPlayersObservable);
            roomPlayers.forEach((name) => {
                const player: PlayerInfo = {
                    name,
                    score: 0,
                    hasAbandoned: false,
                    bonusCount: 0,
                };
                this.playersList.push(player);
            });
        }
    }

    isResultsPage() {
        return this.isResultsRoute;
    }

    listenToSocketEvents() {
        this.socketService.on(GameEvents.PlayerAbandonedGame, (playerName: string) => {
            this.updatePlayerStatus(playerName);
        });

        this.socketService.on(GameEvents.AddPointsToPlayer, (response: AddPointsResponse) => {
            this.updatePlayerScore(response);
        });

        // TODO : gerer l'ajout de bonus aux joueurs
        //  this.socketService.on(GameEvents.GiveBonus, () => {
        //     this.updatePlayerBonusCount(response);
        // });
    }

    private updatePlayerStatus(playerName: string) {
        const playerToUpdate = this.playersList.find((player) => player.name === playerName);
        if (playerToUpdate) {
            playerToUpdate.hasAbandoned = true;
        }
    }

    private updatePlayerScore(response: AddPointsResponse) {
        const playerToUpdate = this.playersList.find((player) => player.name === response.name);
        if (playerToUpdate) {
            playerToUpdate.score += response.pointsToAdd;
        }
    }

    private sortPlayers() {
        this.playersList.sort((a, b) => {
            if (a.score === b.score) {
                return a.name.localeCompare(b.name);
            }
            return b.score - a.score;
        });
    }
}
