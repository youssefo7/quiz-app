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
    private isButtonPressed: boolean;

    constructor(private readonly gameService: GameService) {
        this.timer = new Subject<number>();
        this.isButtonPressed = false;
        this.counter = 0;
        this.subscribeToGameService();
    }

    get time() {
        return this.counter;
    }
    private set time(newTime: number) {
        this.counter = newTime;
    }

    getTime(): Observable<number> {
        return this.timer.asObservable();
    }

    async startTimer(startValue: number): Promise<void | Observable<number | undefined>> {
        if (this.interval) {
            return new Observable<number | undefined>();
        }

        this.time = startValue;

        return new Promise<void>((resolve) => {
            this.interval = window.setInterval(() => {
                this.timer.next(this.time);
                if (this.time > 0 && !this.isButtonPressed) {
                    this.time--;
                } else {
                    this.stopTimer();
                    resolve();
                }
            }, Constants.ONE_SECOND_INTERVAL);
        });
    }

    stopTimer() {
        clearInterval(this.interval);
        this.interval = undefined;
        this.time = 0;
        this.isButtonPressed = false;
    }

    private subscribeToGameService() {
        this.gameService.isButtonPressed.subscribe((isPressed: boolean) => {
            this.isButtonPressed = isPressed;
        });
    }
}
