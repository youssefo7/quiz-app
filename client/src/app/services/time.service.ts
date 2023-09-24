import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class TimeService {
    // TODO : Permettre plus qu'une minuterie à la fois
    private interval: number | undefined;
    private readonly tick = 1000;

    private counter = 0;
    get time() {
        return this.counter;
    }
    private set time(newTime: number) {
        this.counter = newTime;
    }

    async startTimer(startValue: number) {
        if (this.interval) return;

        this.time = startValue;

        return new Promise<void>((resolve) => {
            this.interval = window.setInterval(() => {
                if (this.time > 0) {
                    this.time--;
                } else {
                    this.stopTimer();
                    resolve();
                }
            }, this.tick);
        });
    }

    stopTimer() {
        clearInterval(this.interval);
        this.interval = undefined;
    }
}
