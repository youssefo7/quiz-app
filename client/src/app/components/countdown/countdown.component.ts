import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';
import { TimeService } from '@app/services/time.service';

@Component({
    selector: 'app-countdown',
    templateUrl: './countdown.component.html',
    styleUrls: ['./countdown.component.scss'],
})
export class CountdownComponent implements OnInit {
    quiz: Quiz | null;
    message: string;
    clockStyle: { backgroundColor: string };

    // Raison: J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private readonly timeService: TimeService,
        private route: ActivatedRoute,
        private router: Router,
        private gameService: GameService,
    ) {}

    get time(): number {
        return this.timeService.time;
    }

    ngOnInit() {
        this.loadTimer();
    }

    async getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');
        this.quiz = await this.gameService.getQuizById(id);
    }

    async transitionClock() {
        const transitionTime = 3;
        this.message = 'Préparez-vous!';
        this.clockStyle = { backgroundColor: '#E5E562' };
        await this.timeService.startTimer(transitionTime);
    }

    async questionClock() {
        this.message = 'Temps Restant';
        this.clockStyle = { backgroundColor: 'lightblue' };
        if (this.quiz) {
            await this.timeService.startTimer(this.quiz.duration);
        }
    }

    async leaveGameClock() {
        const exitTransitionTime = 3;
        this.message = 'Redirection vers «Créer une Partie»';
        this.clockStyle = { backgroundColor: 'white' };
        await this.timeService.startTimer(exitTransitionTime);
    }

    async gameClock() {
        if (this.quiz) {
            const lastQuestionIndex = this.quiz.questions.length - 1;
            let currentQuestionIndex = 0;

            while (currentQuestionIndex <= lastQuestionIndex) {
                await this.questionClock();
                if (currentQuestionIndex !== lastQuestionIndex) {
                    await this.transitionClock();
                }
                currentQuestionIndex++;
            }
            this.leaveGame();
        }
    }

    async leaveGame() {
        const isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
        if (isTestGame) {
            this.gameService.setGameEndState = true;
            await this.leaveGameClock();
            await this.router.navigateByUrl('/game/new');
        }
    }

    async loadTimer() {
        await this.getQuiz();
        this.gameClock();
    }
}
