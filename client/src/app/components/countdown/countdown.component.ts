import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';
import { TimeService } from '@app/services/time.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-countdown',
    templateUrl: './countdown.component.html',
    styleUrls: ['./countdown.component.scss'],
})
export class CountdownComponent implements OnInit, OnDestroy {
    @Input() isHost: boolean;
    quiz: Quiz | null;
    message: string;
    clockStyle: { backgroundColor: string };
    private timerSubscription: Subscription;
    private isQuestionTransitioning: boolean;

    // Raison: J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private readonly timeService: TimeService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly gameService: GameService,
    ) {
        this.isHost = false;
    }

    get time() {
        return this.timeService.time;
    }

    ngOnInit() {
        this.loadTimer();
    }

    ngOnDestroy() {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
        }
    }

    async loadTimer() {
        await this.getQuiz();
        this.switchColorToRedOnThreeSeconds();
        this.gameClock();
    }

    async getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');
        this.quiz = await this.gameService.getQuizById(id);
    }

    switchColorToRedOnThreeSeconds() {
        const switchColorTime = 4;
        this.timerSubscription = this.timeService.getTime().subscribe((time: number) => {
            if (!this.isQuestionTransitioning && time <= switchColorTime) {
                this.clockStyle = { backgroundColor: '#FF4D4D' };
            }
        });
    }

    async transitionClock() {
        const transitionTime = 3;
        this.isQuestionTransitioning = true;
        this.message = 'Préparez-vous!';
        this.clockStyle = { backgroundColor: '#E5E562' };
        await this.timeService.startTimer(transitionTime);
    }

    async questionClock() {
        this.isQuestionTransitioning = false;
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
}
