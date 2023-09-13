import { Component } from '@angular/core';
import { TimeService } from '@app/services/time.service';

@Component({
    selector: 'app-countdown',
    templateUrl: './countdown.component.html',
    styleUrls: ['./countdown.component.scss'],
})
export class CountdownComponent {
    // Here 5 will be replace by duration field from the game
    private readonly countdown = 10;
    public isCountdownStarted = false;

    constructor(private readonly timeService: TimeService) {}

    get time(): number {
        return this.timeService.time;
    }

    ngOnInit(): void {
        setTimeout(() => {
            this.isCountdownStarted = true;
            this.timeService.startTimer(this.countdown);
        }, 3000); // To add in a constant (in milliseconds)
    }
}
