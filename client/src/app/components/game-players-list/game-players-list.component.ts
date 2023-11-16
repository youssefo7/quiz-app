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

const playerStatePriorities = {
    hasNotInteracted: 0,
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
    isHost: boolean;
    playerResults: Results[];
    isResultsRoute: boolean;
    private quizId: string;
    private shouldSortNamesAscending: boolean;
    private shouldSortPointsAscending: boolean;
    private shouldSortStatesAscending: boolean;
    // Raison: Les quatres injections sont nécessaires pour ma composante
    // eslint-disable-next-line max-params
    constructor(
        private socketService: SocketClientService,
        private roomCommunicationService: RoomCommunicationService,
        private router: Router,
        private route: ActivatedRoute,
    ) {
        this.isResultsRoute = this.route.snapshot.url.some((segment) => segment.path === 'results');
        this.playerResults = [];
        this.quizId = this.route.snapshot.paramMap.get('quizId') as string;
        this.shouldSortNamesAscending = true;
        this.shouldSortPointsAscending = true;
        this.shouldSortStatesAscending = true;
        this.isHost = this.route.snapshot.url.some((segment) => segment.path === 'host');
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
            roomPlayers.forEach((playerName) => {
                const player: Results = {
                    name: playerName,
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


    sortByName() {
        this.playerResults.sort((a, b) => (this.shouldSortNamesAscending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
        this.shouldSortNamesAscending = !this.shouldSortNamesAscending;
    }

    sortByPoints() {
        this.playerResults.sort((a, b) => {
            if (a.points !== b.points) {
                return this.shouldSortPointsAscending ? a.points - b.points : b.points - a.points;
            }
            return a.name.localeCompare(b.name);
        });
        this.shouldSortPointsAscending = !this.shouldSortPointsAscending;
    }

    sortByState() {
        this.playerResults.sort((a, b) => {
            const priorityA = this.getPlayerPriority(a);
            const priorityB = this.getPlayerPriority(b);
            if (priorityA !== priorityB) {
                return this.shouldSortStatesAscending ? priorityA - priorityB : priorityB - priorityA;
            }
            return a.name.localeCompare(b.name);
        });
        this.shouldSortStatesAscending = !this.shouldSortStatesAscending;
    }

    private getPlayerPriority(player: Results) {
        if (player.hasConfirmedAnswer) {
            return playerStatePriorities.hasConfirmed;
        }
        if (player.hasClickedOnAnswerField) {
            return playerStatePriorities.hasInteracted;
        }
        if (player.hasAbandoned) {
            return playerStatePriorities.hasAbandonned;
        }
        return playerStatePriorities.hasNotInteracted;
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
            this.resetPlayersInfo();
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
        const playerToUpdate = this.playerResults.find((player) => player.name === playerName);
        if (playerToUpdate) {
            playerToUpdate.bonusCount++;
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
        this.playerResults.forEach((player) => {
            player.hasClickedOnAnswerField = false;
            player.hasConfirmedAnswer = false;
        });
    }
}
