import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    private readonly isTestGame: boolean;

    constructor(
        private readonly gameService: GameService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        this.title = 'Partie';
        this.playerPoints = 0;
        this.isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
    }

    setPageTitle() {
        if (this.isTestGame) {
            this.title += ' - Test';
        }
    }

    /* TODO: Fix le reload pour que partie en mode test ne soit pas redirigé vers la page de création de partie immédiatement */
    async leaveGamePage(event: Event) {
        event.stopPropagation();
        if (this.isTestGame) {
            await this.router.navigateByUrl('/game/new');
        } else {
            await this.router.navigateByUrl('/home');
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
        this.setPageTitle();
        this.getQuiz();
    }
}
