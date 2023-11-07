import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameEvents } from '@app/events/game.events';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { Results } from '@app/interfaces/player-info';
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
    @Input() roomId: string;
    playerResults: Results[];
    private isResultsRoute: boolean;
    private quizId: string;
    // Raison: Les quatres injections sont nécessaires pour ma composante
    // eslint-disable-next-line max-params
    constructor(
        private socketService: SocketClientService,
        private roomCommunicationService: RoomCommunicationService,
        private router: Router,
        private route: ActivatedRoute,
    ) {
        this.isResultsRoute = this.router.url.includes('results');
        this.playerResults = [];
        this.quizId = this.route.snapshot.paramMap.get('quizId') as string;
    }

    async ngOnInit() {
        await this.fetchPlayersList();
        const canSort = this.isResultsRoute && this.playerResults.length > 0;
        if (canSort) {
            this.sortPlayers();
        }
        this.listenToSocketEvents();
    }

    async fetchPlayersList() {
        if (!this.isResultsRoute) {
            const roomPlayers = await firstValueFrom(this.roomCommunicationService.getRoomPlayers(this.roomId));
            roomPlayers.forEach((name) => {
                const player: Results = {
                    name,
                    points: 0,
                    hasAbandoned: false,
                    bonusCount: 0,
                };
                this.playerResults.push(player);
            });
        } else {
            this.playerResults = await firstValueFrom(this.roomCommunicationService.getPlayerResults(this.roomId));
        }
    }

    // !
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

        this.socketService.on(GameEvents.BonusUpdate, (playerName: string) => {
            this.updatePlayerBonusCount(playerName);
        });

        this.socketService.on(GameEvents.ShowResults, async () => {
            await firstValueFrom(this.roomCommunicationService.sendPlayerResults(this.roomId, this.playerResults));
            this.router.navigateByUrl(`/results/game/${this.quizId}/room/${this.roomId}`);
        });
    }

    private updatePlayerStatus(playerName: string) {
        const playerToUpdate = this.playerResults.find((player) => player.name === playerName);
        if (playerToUpdate) {
            playerToUpdate.hasAbandoned = true;
        }
    }

    private updatePlayerScore(response: AddPointsResponse) {
        const playerToUpdate = this.playerResults.find((player) => player.name === response.name);
        if (playerToUpdate) {
            playerToUpdate.points += response.pointsToAdd;
        }
    }

    private updatePlayerBonusCount(playerName: string) {
        const wantedPlayer = this.playerResults.find((player) => player.name === playerName);
        if (wantedPlayer) {
            wantedPlayer.bonusCount++;
        }
    }

    private sortPlayers() {
        this.playerResults.sort((a, b) => {
            if (a.points === b.points) {
                return a.name.localeCompare(b.name);
            }
            return b.points - a.points;
        });
    }
}
