import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TimeService } from '@app/services/time.service';
import { CountdownComponent } from './countdown.component';
import SpyObj = jasmine.SpyObj;

describe('CountdownComponent', () => {
    let component: CountdownComponent;
    let fixture: ComponentFixture<CountdownComponent>;
    let timeServiceSpy: SpyObj<TimeService>;
    const DELAY_TIME = 3000;

    // Copied from example of play-area.component.spec.ts
    beforeEach(async () => {
        timeServiceSpy = jasmine.createSpyObj('TimeService', ['startTimer', 'stopTimer']);
        await TestBed.configureTestingModule({
            declarations: [CountdownComponent],
            providers: [{ provide: TimeService, useValue: timeServiceSpy }],
        }).compileComponents();
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CountdownComponent],
        });
        fixture = TestBed.createComponent(CountdownComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('isCountdownStarted should be false at the beginning', () => {
        expect(component.isCountdownStarted).toBeFalse();
    });

    it('isCountdownStarted should be true after 3 seconds', fakeAsync(() => {
        component.ngOnInit();
        tick(DELAY_TIME);
        expect(component.isCountdownStarted).toBeTrue();
    }));

    it('get time should return the time from the timeService', () => {
        expect(component.time).toBe(timeServiceSpy.time);
    });

    it('Timer should start few seconds after the page has been loaded', fakeAsync(() => {
        component.ngOnInit();
        tick(DELAY_TIME);
        expect(timeServiceSpy.startTimer).toHaveBeenCalled();
        expect(timeServiceSpy.startTimer).toHaveBeenCalledWith(component['countdown']);
    }));
});
