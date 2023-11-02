import { Component, OnInit } from '@angular/core';
import { PlayerInfo } from '@app/interfaces/player-info';
import { GameEvents } from './../../../../../server/app/gateway/game/game.gateway.events';
import { SocketClientService } from './../../services/socket-client.service';

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

    constructor(public socketService: SocketClientService) {}

    ngOnInit() {
        this.listenToSocketEvents();
        // TODO : fetch player list from back end
    }

    listenToSocketEvents() {
        this.socketService.on(GameEvents.PlayerAbandonedGame, (playerName: string) => {
            this.updatePlayerStatus(playerName);
        });

        this.socketService.on(GameEvents.AddPointsToPlayer, (response: AddPointsResponse) => {
            this.updatePlayerScore(response);
        });
    }

    updatePlayerStatus(playerName: string) {
        const playerToUpdate = this.playersList.find((player) => player.name === playerName);
        if (playerToUpdate) {
            playerToUpdate.hasAbandoned = true;
        }
    }

    updatePlayerScore(response: AddPointsResponse) {
        const playerToUpdate = this.playersList.find((player) => player.name === response.name);
        if (playerToUpdate) {
            playerToUpdate.score += response.pointsToAdd;
        }
    }
}
