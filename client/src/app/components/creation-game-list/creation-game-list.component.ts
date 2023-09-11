import { Component } from '@angular/core';
import { Game, QuizQuestion } from '@app/interfaces/games';

@Component({
    selector: 'app-creation-game-list',
    templateUrl: './creation-game-list.component.html',
    styleUrls: ['./creation-game-list.component.scss'],
})
export class CreationGameListComponent {
    games: {
        name: string;
        dateCreated: string;
        visible: boolean;
        description: string;
        time: string;
        questions: QuizQuestion[];
    }[] = [
        {
            name: 'jeu1',
            dateCreated: '11-11-11',
            visible: true,
            description: 'description jeu1',
            time: '11:11',
            questions: [],
        },
        {
            name: 'jeu2',
            dateCreated: '22-22-22',
            visible: true,
            description: 'description jeu2',
            time: '22:22',
            questions: [],
        },
        {
            name: 'jeu3',
            dateCreated: '33-33-33',
            visible: false,
            description: 'description jeu3',
            time: '33:33',
            questions: [],
        },
    ];

    // selectedGame: Game | null = null;
    gameHiddenOrDeleted: boolean = false;
    visibleGames: Game[] = [];
    selectedGameIndex: number | null = null;

    constructor() {
        this.visibleGames = this.getVisibleGames();
    }

    toggleDetails(index: number): void {
        if (this.selectedGameIndex === index) {
            this.selectedGameIndex = null;
        } else {
            this.selectedGameIndex = index;
        }
        this.gameHiddenOrDeleted = false;
    }

    getQuestionsArray(game: Game): QuizQuestion[] {
        if (game.questions && game.questions) {
            return game.questions;
        }
        return [];
    }

    getVisibleGames(): Game[] {
        return this.games.filter((game) => game.visible === true);
    }

    testGame(game: Game): void {
        // rediriger vers tester jeu
    }
    createGame(game: Game): void {
        // rediriger vers creer jeu
    }
}
