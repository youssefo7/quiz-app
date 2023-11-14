import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Results } from '@app/interfaces/player-info';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { firstValueFrom } from 'rxjs';

interface AddPointsResponse {
    pointsToAdd: number;
    name: string;
}

const playerStatePriorities = {
    hasNotinteracted: 0,
    hasInteracted: 1,
    hasConfirmed: 2,
    hasAbandonned: 3,
};

@Component({
    selector: 'app-game-players-list',
    templateUrl: './game-players-list.component.html',
    styleUrls: ['./game-players-list.component.scss'],
})
export class GamePlayersListComponent implements OnInit {
    @Input() roomId: string | null;
    playerResults: Results[];
    isResultsRoute: boolean;
    private quizId: string;
    private isSortNamesAscending: boolean;
    private isSortPointsAscending: boolean;
    private isSortStatesAscending: boolean;
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
        this.isSortNamesAscending = true;
        this.isSortPointsAscending = true;
        this.isSortStatesAscending = true;
    }

    async ngOnInit() {
        if (!this.socketService.socketExists()) {
            return;
        }

        await this.fetchPlayersList();

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

    sortByName() {
        this.playerResults.sort((a, b) => {
            return this.isSortNamesAscending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        });
        this.isSortNamesAscending = !this.isSortNamesAscending;
    }

    sortByPoints() {
        this.playerResults.sort((a, b) => {
            if (a.points !== b.points) {
                return this.isSortPointsAscending ? a.points - b.points : b.points - a.points;
            }
            return a.name.localeCompare(b.name);
        });
        this.isSortPointsAscending = !this.isSortPointsAscending;
    }

    sortByState() {
        this.playerResults.sort((a, b) => {
            const priorityA = this.getPlayerPriority(a);
            const priorityB = this.getPlayerPriority(b);
            if (priorityA !== priorityB) {
                return this.isSortStatesAscending ? priorityA - priorityB : priorityB - priorityA;
            }
            return a.name.localeCompare(b.name);
        });
        this.isSortStatesAscending = !this.isSortStatesAscending;
    }

    getPlayerPriority(player: Results) {
        if (player.hasConfirmedAnswer) {
            return playerStatePriorities.hasConfirmed;
        }
        if (player.hasClickedOnAnswerField) {
            return playerStatePriorities.hasInteracted;
        }
        if (player.hasAbandoned) {
            return playerStatePriorities.hasAbandonned;
        }
        return playerStatePriorities.hasNotinteracted;
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
}
