import { Component } from '@angular/core';
import { Game, QuizQuestion } from '@app/interfaces/games';

@Component({
    selector: 'app-creation-game-list',
    templateUrl: './creation-game-list.component.html',
    styleUrls: ['./creation-game-list.component.scss'],
})
export class CreationGameListComponent {
    games: {
        id: string;
        name: string;
        dateCreated: string;
        visible: boolean;
        description: string;
        time: string;
        questions: QuizQuestion[];
    }[] = [
        {
            id: '1',
            name: 'jeu1',
            dateCreated: '11-11-11',
            visible: true,
            description: 'description jeu1',
            time: '11:11',
            questions: [],
        },
        {
            id: '2',
            name: 'jeu2',
            dateCreated: '22-22-22',
            visible: true,
            description: 'description jeu2',
            time: '22:22',
            questions: [
                {
                    type: 'QCM',
                    text: 'Question 1',
                    choices: [
                        { text: 'Choice 1', isCorrect: false },
                        { text: 'Choice 2', isCorrect: true },
                    ],
                },
                {
                    type: 'QCM',
                    text: 'Question 2',
                    choices: [
                        { text: 'Choice 1', isCorrect: true },
                        { text: 'Choice 2', isCorrect: false },
                    ],
                },
            ],
        },
        {
            id: '3',
            name: 'jeu3',
            dateCreated: '33-33-33',
            visible: false,
            description: 'description jeu3',
            time: '33:33',
            questions: [],
        },
    ];

    gameHiddenOrDeleted: boolean = false;
    visibleGames: Game[] = [];
    selectedGameId: number | null = null;

    constructor() {
        this.visibleGames = this.getVisibleGames();
    }

    toggleDetails(gameId: number): void {
        if (this.selectedGameId === gameId) {
            this.selectedGameId = null;
        } else {
            this.selectedGameId = gameId;
        }
        this.gameHiddenOrDeleted = false;
    }

    getQuestionsArray(game: Game): QuizQuestion[] {
        return game.questions || [];
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
