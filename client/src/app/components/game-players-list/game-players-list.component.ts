import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { History } from '@app/interfaces/history';
import { HistoryCommunicationService } from '@app/services/history-communication.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ChatEvents } from '@common/chat.events';
import { Constants } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { Results } from '@common/player-info';
import { PlayerPoints } from '@common/player-points';
import { PlayerSubmission } from '@common/player-submission';
import { TimeEvents } from '@common/time.events';
import { firstValueFrom } from 'rxjs';

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
    shouldSortPointsAscending: boolean;
    shouldSortNamesAscending: boolean;
    private quizId: string;
    private shouldSortStatesAscending: boolean;
    private isSortedByPoints: boolean;
    private isSortedByState: boolean;
    private currentDateTime: string;

    // Raison: Les quatres injections sont nécessaires pour ma composante
    // eslint-disable-next-line max-params
    constructor(
        private socketService: SocketClientService,
        private roomCommunicationService: RoomCommunicationService,
        private historyCommunicationService: HistoryCommunicationService,
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
        this.currentDateTime = new Date().toISOString();
    }

    async ngOnInit() {
        if (!this.socketService.socketExists()) {
            return;
        }

        await this.fetchPlayersList();
        this.listenToSocketEvents();

        if (this.isResultsRoute) {
            this.shouldSortPointsAscending = false;
            this.sortByPoints();
        }
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
        this.isSortedByPoints = false;
        this.isSortedByState = false;
    }

    sortByPoints() {
        this.playerResults.sort((a, b) => {
            if (a.points !== b.points) {
                return this.shouldSortPointsAscending ? a.points - b.points : b.points - a.points;
            }
            return a.name.localeCompare(b.name);
        });
        this.shouldSortPointsAscending = !this.shouldSortPointsAscending;
        this.isSortedByPoints = true;
        this.isSortedByState = false;
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
        this.isSortedByPoints = false;
        this.isSortedByState = true;
    }

    toggleChattingRights(name: string) {
        this.socketService.send(ChatEvents.ToggleChattingRights, { roomId: this.roomId, playerName: name });
    }

    private getPlayerPriority(player: Results): PlayerState {
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
            this.markAsAbandoned(playerName);
            if (this.isSortedByState) {
                this.shouldSortStatesAscending = !this.shouldSortStatesAscending;
                this.sortByState();
            }
        });

        this.socketService.on(GameEvents.AddPointsToPlayer, (response: PlayerPoints) => {
            this.updatePlayerScore(response);
            if (this.isSortedByPoints) {
                this.shouldSortPointsAscending = !this.shouldSortPointsAscending;
                this.sortByPoints();
            }
        });

        this.socketService.on(GameEvents.BonusUpdate, (playerName: string) => {
            this.updatePlayerBonusCount(playerName);
        });

        this.socketService.on(GameEvents.SendResults, async () => {
            await firstValueFrom(this.roomCommunicationService.sendPlayerResults(this.roomId as string, this.playerResults));
            await this.addGameToHistory();
            this.socketService.send(GameEvents.ShowResults, this.roomId);
            this.router.navigateByUrl(`/results/game/${this.quizId}/room/${this.roomId}/host`);
        });

        this.socketService.on(GameEvents.SubmitAnswer, (playerSubmission: PlayerSubmission) => {
            if (playerSubmission.hasSubmittedBeforeEnd) {
                this.updateAnswerConfirmation(playerSubmission.name as string);
                if (this.isSortedByState) {
                    this.shouldSortStatesAscending = !this.shouldSortStatesAscending;
                    this.sortByState();
                }
            }
        });

        this.socketService.on(GameEvents.FieldInteraction, (playerName: string) => {
            this.updatePlayerInteraction(playerName);
            if (this.isSortedByState) {
                this.shouldSortStatesAscending = !this.shouldSortStatesAscending;
                this.sortByState();
            }
        });

        this.socketService.on(TimeEvents.TimerFinished, (isTransitionTimer: boolean) => {
            if (isTransitionTimer) {
                this.resetPlayersInfo();
                if (this.isSortedByState) {
                    this.shouldSortStatesAscending = !this.shouldSortStatesAscending;
                    this.sortByState();
                }
            }
        });
    }

    private markAsAbandoned(playerName: string) {
        const playerToUpdate = this.playerResults.find((player) => player.name === playerName) as Results;
        playerToUpdate.hasConfirmedAnswer = false;
        playerToUpdate.hasClickedOnAnswerField = false;
        playerToUpdate.hasAbandoned = true;
    }

    private updatePlayerScore(response: PlayerPoints) {
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

    private async addGameToHistory() {
        const quiz = await firstValueFrom(this.roomCommunicationService.getRoomQuiz(this.roomId as string));
        const date = this.currentDateTime.split('T')[0];
        const time = this.currentDateTime.split('T')[1].substring(0, Constants.TIME_LENGTH);

        const playersSortedByPoints = [...this.playerResults];
        playersSortedByPoints.sort((a, b) => b.points - a.points);

        const game: History = {
            name: quiz.title,
            date: `${date} ${time}`,
            numberOfPlayers: playersSortedByPoints.length,
            maxScore: playersSortedByPoints[0].points,
        };

        await firstValueFrom(this.historyCommunicationService.addHistory(game));
    }
}
