import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss', '../../../assets/shared.scss'],
})
export class GamePageComponent implements OnInit {
    title: string;
    link: string;
    quiz: Quiz | null;
    playerPoints: number;
    private readonly isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');

    constructor(
        private readonly gameService: GameService,
        private readonly route: ActivatedRoute,
    ) {
        this.title = 'Partie';
        this.link = '/home';
        this.playerPoints = 0;
    }

    checkGameRoute(isTestGame = this.isTestGame) {
        if (isTestGame) {
            this.link = '/game/new';
            this.title += ' - Test';
        }
    }

    async getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');
        this.quiz = await this.gameService.getQuizById(id);
    }

    givePoints(points: number) {
        this.playerPoints += points;
    }

    ngOnInit() {
        this.checkGameRoute();
        this.getQuiz();
    }
}
