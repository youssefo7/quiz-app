import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { CommunicationService } from '@app/services/communication.service';
import { TimeService } from '@app/services/time.service';
import { CountdownComponent } from './countdown.component';
import SpyObj = jasmine.SpyObj;

describe('CountdownComponent', () => {
    let component: CountdownComponent;
    let fixture: ComponentFixture<CountdownComponent>;
    let timeServiceSpy: SpyObj<TimeService>;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;

    // Copied from example of play-area.component.spec.ts
    beforeEach(async () => {
        timeServiceSpy = jasmine.createSpyObj('TimeService', ['startTimer', 'stopTimer']);
        await TestBed.configureTestingModule({
            declarations: [CountdownComponent],
            providers: [
                { provide: TimeService, useValue: timeServiceSpy },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } },
                { provide: CommunicationService, useValue: communicationServiceSpy },
            ],
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

    // TODO: Écrire les tests unitaires manquants

    it('isCountdownStarted should be false at the beginning', () => {
        // expect(component.isCountdownStarted).toBeFalse();
    });

    it('isCountdownStarted should be true once the quiz has loaded', () => {
        // expect(component.isCountdownStarted).toBeTrue();
    });

    it('get time should return the time from the timeService', () => {
        // expect(component.time).toBe(timeServiceSpy.time);
    });

    it('Timer should start few seconds after the page has been loaded', fakeAsync(() => {
        // expect(timeServiceSpy.startTimer).toHaveBeenCalled();
        // expect(timeServiceSpy.startTimer).toHaveBeenCalledWith(component['countdown']);
    }));
});
