import { Component } from '@angular/core';
import { PlayerInfo } from '@app/interfaces/player-info';

@Component({
    selector: 'app-game-players-list',
    templateUrl: './game-players-list.component.html',
    styleUrls: ['./game-players-list.component.scss'],
})
export class GamePlayersListComponent {
    playersList: PlayerInfo[] = [
        { name: 'emile', score: 10, hasAbandoned: true },
        { name: 'marc', score: 10, hasAbandoned: true },
        { name: 'moh', score: 54, hasAbandoned: false },
        { name: 'javas', score: 2353, hasAbandoned: true },
        { name: 'pocnok', score: 4310, hasAbandoned: false },
    ];
    // TODO: ngOnInit should fetch the list of players to be used in the html (maybe given through Input)
}
