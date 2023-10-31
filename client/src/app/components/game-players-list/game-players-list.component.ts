import { Component, Input, OnInit } from '@angular/core';
import { PlayerInfo } from '@app/interfaces/player-info';
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
    @Input() playersList: PlayerInfo[];

    constructor(public socketService: SocketClientService) {}

    ngOnInit(): void {
        this.listenToSocketEvents();
    }

    listenToSocketEvents() {
        this.socketService.on('abandonedGame', (playerName: string) => {
            this.updatePlayerStatus(playerName);
        });

        this.socketService.on('addPointsToPlayer', (response: AddPointsResponse) => {
            this.updatePayerScore(response);
        });
    }

    updatePlayerStatus(playerName: string) {
        const playerToUpdate = this.playersList.find((player) => player.name === playerName);
        if (playerToUpdate) {
            playerToUpdate.hasAbandoned = true;
        }
    }

    updatePayerScore(response: AddPointsResponse) {
        const playerToUpdate = this.playersList.find((player) => player.name === response.name);
        if (playerToUpdate) {
            playerToUpdate.score += response.pointsToAdd;
        }
    }
}
