import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, discardPeriodicTasks, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { GameService } from './game.service';
import { TimeService } from './time.service';

describe('TimeService', () => {
    let service: TimeService;
    const TIMEOUT = 5;
    const MS_SECOND = 1000;
    let gameService: GameService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        }).compileComponents();
        service = TestBed.inject(TimeService);
        gameService = TestBed.inject(GameService);
    }));

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('startTimer should start an interval', fakeAsync(() => {
        service.startTimer(TIMEOUT, false);
        const interval = service['interval'];
        expect(interval).toBeTruthy();
        expect(service.time).toEqual(TIMEOUT);
        discardPeriodicTasks();
    }));

    it('startTimer should call setInterval', fakeAsync(() => {
        const spy = spyOn(window, 'setInterval');
        service.startTimer(TIMEOUT, false);
        expect(spy).toHaveBeenCalled();
        discardPeriodicTasks();
    }));

    it('interval should reduce time by 1 every second ', fakeAsync(() => {
        service.startTimer(TIMEOUT, false);
        tick(MS_SECOND);
        expect(service.time).toEqual(TIMEOUT - 1);
        tick(MS_SECOND);
        expect(service.time).toEqual(TIMEOUT - 2);
        discardPeriodicTasks();
    }));

    it('interval should stop after TIMEOUT seconds ', fakeAsync(() => {
        service.startTimer(TIMEOUT, false);
        tick((TIMEOUT + 2) * MS_SECOND);
        expect(service.time).toEqual(0);
        discardPeriodicTasks();
    }));

    it('startTimer should not start a new interval if one exists', fakeAsync(() => {
        service.startTimer(TIMEOUT, false);
        const spy = spyOn(window, 'setInterval');
        service.startTimer(TIMEOUT, false);
        expect(spy).not.toHaveBeenCalled();
        discardPeriodicTasks();
    }));

    it('startTimer should call stopTimer at the end of timer', fakeAsync(() => {
        const spy = spyOn(service, 'stopTimer').and.callThrough();
        service.startTimer(TIMEOUT, false);
        tick((TIMEOUT + 1) * MS_SECOND);
        expect(spy).toHaveBeenCalled();
        discardPeriodicTasks();
    }));

    it('stopTimer should call clearInterval and setInterval to undefined', fakeAsync(() => {
        const spy = spyOn(window, 'clearInterval');
        service.stopTimer();
        expect(spy).toHaveBeenCalled();
        expect(service['interval']).toBeFalsy();
        discardPeriodicTasks();
    }));

    it('should set to isButtonPressed to its value when it changes in gameService', () => {
        let isButtonPressedValue = true;
        gameService.setSubmitButtonPressState = isButtonPressedValue;
        expect(service['isSubmitButtonPressed']).toEqual(isButtonPressedValue);

        isButtonPressedValue = false;
        gameService.setSubmitButtonPressState = isButtonPressedValue;
        expect(service['isSubmitButtonPressed']).toEqual(isButtonPressedValue);
    });
});
