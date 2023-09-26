import { ComponentFixture, TestBed } from '@angular/core/testing';
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
        fixture = TestBed.createComponent(CountdownComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // TODO: Implémenter les tests unitaires
});
