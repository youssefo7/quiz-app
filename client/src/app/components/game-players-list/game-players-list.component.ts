import { Component, Input } from '@angular/core';
import { PlayerInfo } from '@app/interfaces/player-info';
import { SocketClientService } from './../../services/socket-client.service';

@Component({
    selector: 'app-game-players-list',
    templateUrl: './game-players-list.component.html',
    styleUrls: ['./game-players-list.component.scss'],
})
export class GamePlayersListComponent {
    @Input() playersList: PlayerInfo[];
    socketService: SocketClientService;

    configureBaseSocketFeatures() {
        this.socketService.on('abandonedGame', (playerName) => {
            const playerToUpdate = this.playersList.find((player) => player.name === playerName);
            if (playerToUpdate) {
                playerToUpdate.hasAbandoned = true;
            }
        });
    }
}
