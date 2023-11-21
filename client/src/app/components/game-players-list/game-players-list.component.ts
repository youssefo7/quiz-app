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

enum PlayerState {
    HasNotInteracted,
    HasInteracted,
    HasConfirmed,
    HasAbandoned,
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
    canChat: boolean;
    shouldSortPointsAscending: boolean;
    shouldSortNamesAscending: boolean;
    private quizId: string;
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
        this.canChat = true;
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

    toggleChattingRights(name: string) {
        this.socketService.send(ChatEvents.ToggleChattingRights, { roomId: this.roomId, playerName: name });
        this.canChat = !this.canChat;
    }

    getPlayerPriority(player: Results): PlayerState {
        let priority;

        if (player.hasConfirmedAnswer) {
            priority = PlayerState.HasConfirmed;
        } else if (player.hasClickedOnAnswerField) {
            priority = PlayerState.HasInteracted;
        } else if (player.hasAbandoned) {
            priority = PlayerState.HasAbandoned;
        } else {
            priority = PlayerState.HasNotInteracted;
        }
        return priority;
    }

    private listenToSocketEvents() {
        this.socketService.on(GameEvents.PlayerAbandonedGame, (playerName: string) => {
            this.markAsAbandonned(playerName);
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

        this.socketService.on(GameEvents.FieldInteraction, (playerName: string) => {
            this.updatePlayerInteraction(playerName);
        });

        this.socketService.on(GameEvents.NextQuestion, () => {
            this.resetPlayersInfo();
        });

        // TODO ajouter pour l'interaction avec la zone de réponse QRL
    }

    private markAsAbandonned(playerName: string) {
        const playerToUpdate = this.playerResults.find((player) => player.name === playerName) as Results;
        playerToUpdate.hasConfirmedAnswer = false;
        playerToUpdate.hasClickedOnAnswerField = false;
        playerToUpdate.hasAbandoned = true;
    }

    private updatePlayerScore(response: AddPointsResponse) {
        const playerToUpdate = this.playerResults.find((player) => player.name === response.name) as Results;
        playerToUpdate.points += response.pointsToAdd;
    }

    private updatePlayerBonusCount(playerName: string) {
        const playerToUpdate = this.playerResults.find((player) => player.name === playerName) as Results;
        playerToUpdate.bonusCount++;
    }

    private updateAnswerConfirmation(playerName: string) {
        const playerToUpdate = this.playerResults.find((player) => player.name === playerName) as Results;
        playerToUpdate.hasConfirmedAnswer = true;
    }

    private updatePlayerInteraction(playerName: string) {
        const playerToUpdate = this.playerResults.find((player) => player.name === playerName) as Results;
        playerToUpdate.hasClickedOnAnswerField = true;
    }

    private resetPlayersInfo() {
        this.playerResults.forEach((player) => {
            player.hasClickedOnAnswerField = false;
            player.hasConfirmedAnswer = false;
        });
    }
}
