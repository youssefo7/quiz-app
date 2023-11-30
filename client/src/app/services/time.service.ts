import { Injectable } from '@angular/core';
import { GameService } from '@app/services/game.service';
import { Constants } from '@common/constants';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TimeService {
    private timer: Subject<number>;
    private interval: number | undefined;
    private counter: number;
    private isSubmitButtonPressed: boolean;
    private isTransitionTimerDone: Subject<boolean>;

    constructor(private readonly gameService: GameService) {
        this.timer = new Subject<number>();
        this.isTransitionTimerDone = new Subject<boolean>();
        this.isSubmitButtonPressed = false;
        this.counter = 0;
        this.subscribeToGameService();
    }

    get time() {
        return this.counter;
    }
    private set time(newTime: number) {
        this.counter = newTime;
    }

    isTimerFinished(): Observable<boolean> {
        return this.isTransitionTimerDone.asObservable();
    }

    getTime(): Observable<number> {
        return this.timer.asObservable();
    }

    async startTimer(startValue: number, isTransitionTimer: boolean): Promise<void | Observable<number | undefined>> {
        if (this.interval) {
            return new Observable<number | undefined>();
        }

        this.time = startValue;

        return new Promise<void>((resolve) => {
            this.interval = window.setInterval(() => {
                this.timer.next(this.time);
                if (this.time > 0 && !this.isSubmitButtonPressed) {
                    this.time--;
                } else {
                    this.stopTimer();
                    this.isTransitionTimerDone.next(isTransitionTimer);
                    resolve();
                }
            }, Constants.ONE_SECOND_INTERVAL);
        });
    }

    stopTimer() {
        clearInterval(this.interval);
        this.interval = undefined;
        this.time = 0;
        this.isSubmitButtonPressed = false;
    }

    private subscribeToGameService() {
        this.gameService.isSubmitButtonPressed.subscribe((isPressed: boolean) => {
            this.isSubmitButtonPressed = isPressed;
        });
    }
}
