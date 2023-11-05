import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameEvents } from '@app/events/game.events';
import { TimeEvents } from '@app/events/time.events';
import { Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { Subscription } from 'rxjs';

const ONE_SECOND_INTERVAL = 1000;

@Component({
    selector: 'app-countdown',
    templateUrl: './countdown.component.html',
    styleUrls: ['./countdown.component.scss'],
})
export class CountdownComponent implements OnInit, OnDestroy {
    @Input() isHost: boolean;
    message: string;
    clockStyle: { backgroundColor: string };
    private socketTime: number;
    private quiz: Quiz | null;
    private timerSubscription: Subscription;
    private isQuestionTransitioning: boolean;
    private currentQuestionIndex: number;
    private lastQuestionIndex: number;
    private isTestGame: boolean;
    private gameServiceSubscription: Subscription;
    private hasFinishedTransitionClock: boolean;
    private roomId: string;

    // Tous ces paramètres sont nécessaires pour que la composante fonctionne bien
    // eslint-disable-next-line max-params
    constructor(
        private readonly timeService: TimeService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly gameService: GameService,
        private readonly socketClientService: SocketClientService,
    ) {
        this.isHost = false;
        this.currentQuestionIndex = 0;
        this.isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
        this.roomId = this.route.snapshot.paramMap.get('roomId') as string;
    }

    get time() {
        return this.isTestGame ? this.timeService.time : this.socketTime;
    }

    ngOnInit() {
        this.loadTimer();
    }

    ngOnDestroy() {
        if (this.timerSubscription) this.timerSubscription.unsubscribe();
        if (this.gameServiceSubscription) this.gameServiceSubscription.unsubscribe();
    }

    private async loadTimer() {
        await this.getQuiz();
        if (this.quiz) {
            this.lastQuestionIndex = this.quiz.questions.length - 1;
        }
        if (this.isTestGame) {
            this.switchColorToRedOnThreeSeconds();
            this.testGameClock();
        } else {
            this.reactToTimerEvent();
            this.reactToTimerFinishedEvent();
            this.reactToNextQuestionEvent();
            this.questionClock();
            this.currentQuestionIndex++;
        }
    }

    private reactToTimerEvent() {
        this.socketClientService.on(TimeEvents.CurrentTimer, (time: number) => {
            this.socketTime = time;
            const switchColorTime = 3;
            this.setClockColorToRed(this.socketTime, switchColorTime);
        });
    }

    private reactToTimerFinishedEvent() {
        this.socketClientService.on(TimeEvents.TimerFinished, () => {
            if (this.hasFinishedTransitionClock) {
                this.currentQuestionIndex++;
                this.hasFinishedTransitionClock = false;
                this.questionClock();
            }
        });
    }

    private reactToNextQuestionEvent() {
        this.socketClientService.on(GameEvents.NextQuestion, () => {
            if (this.currentQuestionIndex <= this.lastQuestionIndex) {
                this.hasFinishedTransitionClock = true;
                this.transitionClock();
            }
        });
    }

    private async getQuiz() {
        const quizId = this.route.snapshot.paramMap.get('quizId');
        this.quiz = await this.gameService.getQuizById(quizId);
    }

    private switchColorToRedOnThreeSeconds() {
        const switchColorTime = 4;
        this.timerSubscription = this.timeService.getTime().subscribe((time: number) => {
            this.setClockColorToRed(time, switchColorTime);
        });
    }

    private setClockColorToRed(time: number, switchColorTime: number) {
        if (!this.isQuestionTransitioning && time <= switchColorTime) {
            this.clockStyle = { backgroundColor: '#FF4D4D' };
        }
    }

    // TODO: Revoir l'affichage de la question suivante après la transition
    private async transitionClock() {
        const transitionTime = 3;
        this.isQuestionTransitioning = true;
        this.message = 'Préparez-vous!';
        this.clockStyle = { backgroundColor: '#E5E562' };
        if (this.isTestGame) {
            await this.timeService.startTimer(transitionTime);
        } else {
            this.socketClientService.send(TimeEvents.StartTimer, { initialTime: transitionTime, roomId: this.roomId, tickRate: ONE_SECOND_INTERVAL });
        }
    }

    private async questionClock() {
        this.isQuestionTransitioning = false;
        this.message = 'Temps Restant';
        this.clockStyle = { backgroundColor: 'lightblue' };
        if (this.quiz) {
            if (this.isTestGame) {
                await this.timeService.startTimer(this.quiz.duration);
            } else {
                this.socketClientService.send(TimeEvents.StartTimer, {
                    initialTime: this.quiz.duration,
                    roomId: this.roomId,
                    tickRate: ONE_SECOND_INTERVAL,
                });
            }
        }
    }

    private async leaveGameClock() {
        const exitTransitionTime = 3;
        this.isQuestionTransitioning = true;
        this.message = 'Redirection vers «Créer une Partie»';
        this.clockStyle = { backgroundColor: 'white' };
        if (this.isTestGame) {
            await this.timeService.startTimer(exitTransitionTime);
        }
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

    private async leaveGame() {
        this.gameService.setGameEndState = true;
        await this.leaveGameClock();
        await this.router.navigateByUrl('/game/new');
    }
}
