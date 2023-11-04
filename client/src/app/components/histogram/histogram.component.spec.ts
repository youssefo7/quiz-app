import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '@app/services/game.service';
import { TimeService } from '@app/services/time.service';
import { NgChartsModule } from 'ng2-charts';
import { of } from 'rxjs';
import { HistogramComponent } from './histogram.component';

import SpyObj = jasmine.SpyObj;

describe('HistogramComponent', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;
    let gameServiceMock: SpyObj<GameService>;
    let timeServiceMock: SpyObj<TimeService>;

    beforeEach(() => {
        timeServiceMock = jasmine.createSpyObj('TimeService', ['subscribeToGameService', 'getTime']);
        timeServiceMock.getTime.and.returnValue(of(0));
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [HistogramComponent],
            imports: [NgChartsModule],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } },
                { provide: GameService, useValue: gameServiceMock },
                { provide: TimeService, useValue: timeServiceMock },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
