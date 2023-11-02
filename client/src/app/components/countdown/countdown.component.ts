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
    @Input() quiz: Quiz;
    message: string;
    clockStyle: { backgroundColor: string };
    private timerSubscription: Subscription;
    private isQuestionTransitioning: boolean;
    private isNextQuestionPressed: boolean;
    private currentQuestionIndex: number;
    private lastQuestionIndex: number;
    private hasGameStarted: boolean;
    private isTestGame: boolean;
    private gameServiceSubscription: Subscription;

    // All these parameters are needed for the component to work properly
    // eslint-disable-next-line max-params
    constructor(
        private readonly timeService: TimeService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly gameService: GameService,
    ) {
        this.isHost = false;
        this.isNextQuestionPressed = false;
        this.currentQuestionIndex = 0;
        this.hasGameStarted = false;
        this.isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
    }

    get time() {
        return this.timeService.time;
    }

    ngOnInit() {
        this.loadTimer();
    }

    ngOnDestroy() {
        if (this.timerSubscription) this.timerSubscription.unsubscribe();
        if (this.gameServiceSubscription) this.gameServiceSubscription.unsubscribe();
    }

    private async loadTimer() {
        this.switchColorToRedOnThreeSeconds();
        if (this.quiz) {
            this.lastQuestionIndex = this.quiz.questions.length - 1;
        }
        if (this.isTestGame) {
            this.testGameClock();
        } else {
            // this.detectWhenNextQuestionPress();
            this.gameClock();
        }
    }

    private switchColorToRedOnThreeSeconds() {
        const switchColorTime = 4;
        this.timerSubscription = this.timeService.getTime().subscribe((time: number) => {
            if (!this.isQuestionTransitioning && time <= switchColorTime) {
                this.clockStyle = { backgroundColor: '#FF4D4D' };
            }
        });
    }

    private async transitionClock() {
        const transitionTime = 3;
        this.isQuestionTransitioning = true;
        this.message = 'Préparez-vous!';
        this.clockStyle = { backgroundColor: '#E5E562' };
        await this.timeService.startTimer(transitionTime);
    }

    private async questionClock() {
        this.isQuestionTransitioning = false;
        this.message = 'Temps Restant';
        this.clockStyle = { backgroundColor: 'lightblue' };
        if (this.quiz) {
            await this.timeService.startTimer(this.quiz.duration);
        }
    }

    private async leaveGameClock() {
        const exitTransitionTime = 3;
        this.isQuestionTransitioning = true;
        this.message = 'Redirection vers «Créer une Partie»';
        this.clockStyle = { backgroundColor: 'white' };
        await this.timeService.startTimer(exitTransitionTime);
    }

    private async testGameClock() {
        while (this.currentQuestionIndex <= this.lastQuestionIndex) {
            await this.questionClock();
            if (this.currentQuestionIndex !== this.lastQuestionIndex) {
                await this.transitionClock();
            }
            this.currentQuestionIndex++;
        }
        this.leaveGame();
    }

    private async gameClock() {
        if (this.currentQuestionIndex <= this.lastQuestionIndex) {
            if (!this.hasGameStarted) {
                await this.questionClock();
                this.hasGameStarted = true;
                this.currentQuestionIndex++;
            }
            if (this.isNextQuestionPressed) {
                await this.transitionClock();
                await this.questionClock();
                this.currentQuestionIndex++;
            }
        } else {
            // TODO: Rediriger vers la page de résultat
        }
    }

    private async leaveGame() {
        this.gameService.setGameEndState = true;
        await this.leaveGameClock();
        await this.router.navigateByUrl('/game/new');
    }
    // Logique de detection du bouton "Next Question" (Doit être implémenter avec les sockets)
    // detectWhenNextQuestionPress() {
    //     this.gameServiceSubscription = this.gameService.isNextQuestionPressed.subscribe((isPressed) => {
    //         this.isNextQuestionPressed = isPressed;
    //         this.gameClock();
    //     });
    // }
}
