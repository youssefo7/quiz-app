import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { Constants, QTypes } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { TimeEvents } from '@common/time.events';
import { Timer } from '@common/timer';
import { Subscription } from 'rxjs';

interface ClockStyle {
    backgroundColor: string;
}

@Component({
    selector: 'app-countdown',
    templateUrl: './countdown.component.html',
    styleUrls: ['./countdown.component.scss'],
})
export class CountdownComponent implements OnInit, OnDestroy {
    @Input() isHost: boolean;
    @Input() quiz: Quiz;
    @Input() roomId: string;
    @Input() isTestGame: boolean;
    message: string;
    clockStyle: ClockStyle;
    isPaused: boolean;
    isInPanicMode: boolean;
    canTogglePanicMode: boolean;
    canToggleTimer: boolean;
    isTransitionTimerRunning: boolean;
    private socketTime: number;
    private timerSubscription: Subscription;
    private timerFinishedSubscription: Subscription;
    private currentQuestionIndex: number;
    private lastQuestionIndex: number;
    private panicAudio: HTMLAudioElement;
    private panicTime: number;

    // Tous ces paramètres sont nécessaires pour que la composante fonctionne bien
    // eslint-disable-next-line max-params
    constructor(
        private readonly timeService: TimeService,
        private readonly router: Router,
        private readonly socketClientService: SocketClientService,
    ) {
        this.currentQuestionIndex = 0;
        this.isTransitionTimerRunning = false;
        this.isPaused = false;
        this.isInPanicMode = false;
        this.canTogglePanicMode = false;
        this.canToggleTimer = true;
        this.panicAudio = new Audio(Constants.AUDIO);
    }

    get time() {
        return this.isTestGame ? this.timeService.time : this.socketTime;
    }

    async ngOnInit() {
        if (!this.socketClientService.socketExists() && !this.isTestGame) {
            return;
        }
        await this.loadTimer();
    }

    ngOnDestroy() {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
        }
        if (this.timerFinishedSubscription) {
            this.timerFinishedSubscription.unsubscribe();
        }
    }

    toggleTimer() {
        this.isPaused = !this.isPaused;
        const timer: Timer = {
            initialTime: this.time,
            roomId: this.roomId,
            tickRate: Constants.ONE_SECOND_INTERVAL,
            isPaused: this.isPaused,
        };
        this.socketClientService.send(TimeEvents.ToggleTimer, timer);
    }

    panicMode() {
        this.panicAudio.play();
        this.isInPanicMode = true;
        this.canTogglePanicMode = false;
        const panicTimer: Timer = {
            initialTime: this.time,
            roomId: this.roomId,
            tickRate: Constants.QUARTER_SECOND_INTERVAL,
        };
        this.socketClientService.send(TimeEvents.PanicMode, panicTimer);
    }

    private async loadTimer() {
        this.lastQuestionIndex = this.quiz.questions.length - 1;
        this.reactToTimerEvents();

        if (this.isTestGame) {
            this.testGameClock();
        } else {
            this.reactToNextQuestionEvent();
            this.startQuestionClock();
        }
    }

    private listenToSocketEvents() {
        this.socketClientService.on(TimeEvents.CurrentTimer, (time: number) => {
            const isValidPanicSettings = !this.isInPanicMode && !this.canTogglePanicMode;
            if (time <= this.panicTime && isValidPanicSettings) {
                this.canTogglePanicMode = true;
            }
            if (time === 0) {
                this.canToggleTimer = false;
                this.canTogglePanicMode = false;
            }
            this.socketTime = time;
            this.setClockColorToRed(this.socketTime, Constants.SWITCH_COLOR_TIME_GAME);
        });

        this.socketClientService.on(TimeEvents.TimerFinished, (isTransitionTimer: boolean) => {
            this.isTransitionTimerRunning = !isTransitionTimer;
            if (isTransitionTimer) {
                this.currentQuestionIndex++;
                this.setPanicTime(this.currentQuestionIndex);
                this.startQuestionClock();
            }
        });

        this.socketClientService.on(TimeEvents.TimerInterrupted, () => {
            this.socketTime = 0;
            this.canToggleTimer = false;
            this.canTogglePanicMode = false;
            this.isTransitionTimerRunning = true;
        });
    }

    private reactToTimerEvents() {
        if (this.isTestGame) {
            this.timerSubscription = this.timeService.getTime().subscribe((time: number) => {
                this.setClockColorToRed(time, Constants.SWITCH_COLOR_TIME_TEST_GAME);
            });
            this.timerFinishedSubscription = this.timeService.isTimerFinished().subscribe((isTransitionTimer: boolean) => {
                this.isTransitionTimerRunning = !isTransitionTimer;
            });
        } else {
            this.setPanicTime(this.currentQuestionIndex);
            this.listenToSocketEvents();
        }
    }

    private reactToNextQuestionEvent() {
        this.socketClientService.on(GameEvents.NextQuestion, () => {
            if (this.currentQuestionIndex <= this.lastQuestionIndex) {
                this.startTransitionClock();
            }
        });
    }

    private setClockColorToRed(time: number, switchColorTime: number) {
        if (!this.isTransitionTimerRunning && time <= switchColorTime) {
            this.clockStyle = { backgroundColor: '#FF4D4D' };
        }
    }

    private setPanicTime(questionIndex: number) {
        const currentQuestionType = this.quiz.questions[questionIndex].type;
        const isQCM = currentQuestionType === QTypes.QCM;
        this.panicTime = isQCM ? Constants.MIN_TIME_TO_PANIC_QCM : Constants.MIN_TIME_TO_PANIC_QRL;
    }

    private async startTransitionClock() {
        const transitionTime = 3;
        const isTransitionTimer = true;
        this.message = 'Préparez-vous!';
        this.clockStyle = { backgroundColor: '#ffff36' };

        if (this.isTestGame) {
            await this.timeService.startTimer(transitionTime, isTransitionTimer);
        } else {
            const transitionTimer: Timer = {
                initialTime: transitionTime,
                roomId: this.roomId,
                tickRate: Constants.ONE_SECOND_INTERVAL,
                isTransitionTimer,
            };
            this.socketClientService.send(TimeEvents.StartTimer, transitionTimer);
        }
    }

    private async startQuestionClock() {
        const isTransitionTimer = false;
        this.canToggleTimer = true;
        this.canTogglePanicMode = false;
        this.isInPanicMode = false;
        this.message = 'Temps Restant';
        this.clockStyle = { backgroundColor: '' };
        const isQCM = this.quiz.questions[this.currentQuestionIndex].type === QTypes.QCM;
        const questionTime = isQCM ? this.quiz.duration : Constants.MAX_DURATION;

        if (this.isTestGame) {
            await this.timeService.startTimer(questionTime, isTransitionTimer);
        } else {
            const questionTimer: Timer = {
                initialTime: questionTime,
                roomId: this.roomId,
                tickRate: Constants.ONE_SECOND_INTERVAL,
                isTransitionTimer,
            };
            this.socketClientService.send(TimeEvents.StartTimer, questionTimer);
        }
    }

    private async leaveGameClock() {
        const exitTransitionTime = 3;
        const isTransitionTimer = true;
        this.message = 'Redirection vers «Créer une Partie»';
        this.clockStyle = { backgroundColor: 'white' };

        if (this.isTestGame) {
            await this.timeService.startTimer(exitTransitionTime, isTransitionTimer);
        }
    }

    private async testGameClock() {
        while (this.currentQuestionIndex <= this.lastQuestionIndex) {
            await this.startQuestionClock();
            if (this.currentQuestionIndex !== this.lastQuestionIndex) {
                await this.startTransitionClock();
            }
            this.currentQuestionIndex++;
        }
        this.leaveGame();
    }

    private async leaveGame() {
        await this.leaveGameClock();
        await this.router.navigateByUrl('/game/new');
    }
}
