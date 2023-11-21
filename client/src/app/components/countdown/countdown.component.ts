import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { Constants, QTypes } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { TimeEvents } from '@common/time.events';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-countdown',
    templateUrl: './countdown.component.html',
    styleUrls: ['./countdown.component.scss'],
})
export class CountdownComponent implements OnInit, OnDestroy {
    @Input() isHost: boolean;
    @Input() quiz: Quiz;
    @Input() roomId: string | null;
    message: string;
    clockStyle: { backgroundColor: string };
    isPaused: boolean;
    isInPanicMode: boolean;
    canTogglePanicMode: boolean;
    isQuestionTransitioning: boolean;
    canToggleTimer: boolean;
    private socketTime: number;
    private timerSubscription: Subscription;
    private currentQuestionIndex: number;
    private lastQuestionIndex: number;
    private isTestGame: boolean;
    private gameServiceSubscription: Subscription;
    private hasFinishedTransitionClock: boolean;
    private panicAudio: HTMLAudioElement;

    // Tous ces paramètres sont nécessaires pour que la composante fonctionne bien
    // eslint-disable-next-line max-params
    constructor(
        private readonly timeService: TimeService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly gameService: GameService,
        private readonly socketClientService: SocketClientService,
    ) {
        this.currentQuestionIndex = 0;
        this.isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
        this.isPaused = false;
        this.isInPanicMode = false;
        this.canTogglePanicMode = true;
        this.canToggleTimer = true;
        this.panicAudio = new Audio(Constants.AUDIO);
    }

    get time() {
        return this.isTestGame ? this.timeService.time : this.socketTime;
    }

    ngOnInit() {
        if (!this.socketClientService.socketExists() && !this.isTestGame) {
            return;
        }
        this.loadTimer();
    }

    ngOnDestroy() {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
        }
        if (this.gameServiceSubscription) {
            this.gameServiceSubscription.unsubscribe();
        }
    }

    toggleTimer() {
        this.isPaused = !this.isPaused;
        this.socketClientService.send(TimeEvents.ToggleTimer, { roomId: this.roomId, isPaused: this.isPaused, currentTime: this.time });
    }

    panicMode() {
        this.panicAudio.play();
        this.isInPanicMode = true;
        this.canTogglePanicMode = false;

        this.socketClientService.send(TimeEvents.PanicMode, { currentTime: this.time, roomId: this.roomId });
    }

    private getMinPanicTime() {
        const currentQuestionType = this.quiz.questions[this.currentQuestionIndex].type;

        if (currentQuestionType === QTypes.QRL) {
            return Constants.MIN_TIME_TO_PANIC_QRL;
        } else {
            return Constants.MIN_TIME_TO_PANIC_QCM;
        }
    }

    private async loadTimer() {
        this.lastQuestionIndex = this.quiz.questions.length - 1;
        if (this.isTestGame) {
            this.switchColorToRedOnThreeSeconds();
            this.testGameClock();
        } else {
            this.reactToTimerEvent();
            this.reactToTimerFinishedEvent();
            this.reactToNextQuestionEvent();
            this.reactToTimerInterruptedEvent();
            this.questionClock();
        }
    }

    private reactToTimerEvent() {
        const switchColorTime = 3;
        const minPanicTime = this.getMinPanicTime();
        this.socketClientService.on(TimeEvents.CurrentTimer, (time: number) => {
            if (time < minPanicTime) {
                this.canTogglePanicMode = false;
            }
            if (time === 0) {
                this.canToggleTimer = false;
            }
            this.socketTime = time;
            this.setClockColorToRed(this.socketTime, switchColorTime);
        });
    }

    private reactToTimerFinishedEvent() {
        this.socketClientService.on(TimeEvents.TimerFinished, () => {
            if (this.hasFinishedTransitionClock) {
                this.currentQuestionIndex++;
                if (this.isHost) {
                    this.socketClientService.send(TimeEvents.TransitionClockFinished, this.roomId);
                }
                this.hasFinishedTransitionClock = false;
                this.questionClock();
            }
        });
    }

    private reactToTimerInterruptedEvent() {
        this.socketClientService.on(TimeEvents.TimerInterrupted, () => {
            this.socketTime = 0;
            this.canToggleTimer = false;
            this.canTogglePanicMode = false;
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

    private async transitionClock() {
        const transitionTime = 3;
        this.isQuestionTransitioning = true;
        this.message = 'Préparez-vous!';
        this.clockStyle = { backgroundColor: '#E5E562' };
        if (this.isTestGame) {
            await this.timeService.startTimer(transitionTime);
        } else {
            this.socketClientService.send(TimeEvents.StartTimer, {
                initialTime: transitionTime,
                roomId: this.roomId,
                tickRate: Constants.ONE_SECOND_INTERVAL,
            });
        }
    }

    private async questionClock() {
        this.isQuestionTransitioning = false;
        this.canToggleTimer = true;
        this.canTogglePanicMode = true;
        this.isInPanicMode = false;
        this.message = 'Temps Restant';
        this.clockStyle = { backgroundColor: 'lightblue' };

        if (this.quiz) {
            if (this.isTestGame) {
                await this.timeService.startTimer(this.quiz.duration);
            } else {
                this.socketClientService.send(TimeEvents.StartTimer, {
                    initialTime: this.quiz.duration,
                    roomId: this.roomId,
                    tickRate: Constants.ONE_SECOND_INTERVAL,
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
