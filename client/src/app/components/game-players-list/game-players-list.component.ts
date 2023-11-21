import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ChatEvents } from '@common/chat.events';
import { GameEvents } from '@common/game.events';
import { Results } from '@common/player-info';
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
    @Input() roomId: string | null;
    isHost: boolean;
    playerResults: Results[];
    isResultsRoute: boolean;
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
        this.isHost = this.route.snapshot.url.some((segment) => segment.path === 'host');
    }

    async ngOnInit() {
        if (!this.socketService.socketExists()) {
            return;
        }

        await this.fetchPlayersList();
        const canSort = this.isResultsRoute && this.playerResults.length > 0;
        if (canSort) {
            this.sortPlayers();
        }
        this.listenToSocketEvents();
    }

    async fetchPlayersList() {
        if (!this.isResultsRoute) {
            const roomPlayers = await firstValueFrom(this.roomCommunicationService.getRoomPlayers(this.roomId as string));
            roomPlayers.forEach((name) => {
                const player: Results = {
                    name,
                    points: 0,
                    hasAbandoned: false,
                    hasClickedOnAnswerField: false,
                    hasConfirmedAnswer: false,
                    bonusCount: 0,
                };
                this.playerResults.push(player);
            });
        } else {
            this.playerResults = await firstValueFrom(this.roomCommunicationService.getPlayerResults(this.roomId as string));
        }
    }

    toggleChattingRights(name: string) {
        this.socketService.send(ChatEvents.ToggleChattingRights, { roomId: this.roomId, playerName: name });
    }

    private listenToSocketEvents() {
        this.socketService.on(GameEvents.PlayerAbandonedGame, (playerName: string) => {
            this.updatePlayerStatus(playerName);
        });

        this.socketService.on(GameEvents.AddPointsToPlayer, (response: AddPointsResponse) => {
            this.updatePlayerScore(response);
        });

        this.socketService.on(GameEvents.BonusUpdate, (playerName: string) => {
            this.updatePlayerBonusCount(playerName);
        });

        this.socketService.on(GameEvents.SendResults, async () => {
            await firstValueFrom(this.roomCommunicationService.sendPlayerResults(this.roomId as string, this.playerResults));
            this.socketService.send(GameEvents.ShowResults, this.roomId);
            this.router.navigateByUrl(`/results/game/${this.quizId}/room/${this.roomId}/host`);
        });

        this.socketService.on(GameEvents.SubmitQuestionOnClick, (playerName: string) => {
            this.updateAnswerConfirmation(playerName);
        });

        this.socketService.on(GameEvents.QuestionChoiceSelect, (playerName: string) => {
            this.updatePlayerInteraction(playerName);
        });

        this.socketService.on(GameEvents.NextQuestion, () => {
            this.resetPlayersInfo();
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

    private updateAnswerConfirmation(playerName: string) {
        const playerToUpdate = this.playerResults.find((player) => player.name === playerName);
        if (playerToUpdate) {
            playerToUpdate.hasConfirmedAnswer = true;
        }
    }

    private updatePlayerInteraction(playerName: string) {
        const playerToUpdate = this.playerResults.find((player) => player.name === playerName);
        if (playerToUpdate) {
            playerToUpdate.hasClickedOnAnswerField = true;
        }
    }

    private resetPlayersInfo() {
        const activePlayers = this.playerResults.filter((player) => !player.hasAbandoned);
        activePlayers.forEach((player) => {
            player.hasClickedOnAnswerField = false;
            player.hasConfirmedAnswer = false;
        });
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
