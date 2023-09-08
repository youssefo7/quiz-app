import { Component } from '@angular/core';
import { CommunicationService } from '@app/services/communication.service';
import { Game } from '@app/interfaces/games';

@Component({
    selector: 'app-game-list',
    templateUrl: './game-list.component.html',
    styleUrls: ['./game-list.component.scss'],
})
export class GameListComponent {
    games: Game[];

    constructor(private gameService: CommunicationService) {
        this.getGames();
    }

    getGames(): void {
        this.gameService.getGames().subscribe((games) => {
            this.games = games;
        });
    }

    deleteGame(game: Game): void {
        game.name = 'test';
    }

    exportGame(game: Game): void {
        game.name = 'test 2';
    }

    editGame(game: Game): void {
        // Implement logic to navigate to the edit page for the game
        game.name = 'test 3';
    }

    toggleVisibility(game: Game): void {
        game.visible = !game.visible;
        game.name = 'test 4';
    }
}
