import { Component } from '@angular/core';
import { PlayerInfo } from '@app/interfaces/player-info';

@Component({
    selector: 'app-game-players-list',
    templateUrl: './game-players-list.component.html',
    styleUrls: ['./game-players-list.component.scss'],
})
export class GamePlayersListComponent {
    playersList: PlayerInfo[];
    // TODO: ngOnInit should fetch the list of players to be used in the html (maybe given through Input)
}
