import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GamePlayersListComponent } from '@app/components/game-players-list/game-players-list.component';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { GameService } from '@app/services/game.service';
import { TimeService } from '@app/services/time.service';
import { NgChartsModule } from 'ng2-charts';
import { of } from 'rxjs';
import { QuestionZoneStatsComponent } from './question-zone-stats.component';
import SpyObj = jasmine.SpyObj;

describe('QuestionZoneStatsComponent', () => {
    let component: QuestionZoneStatsComponent;
    let fixture: ComponentFixture<QuestionZoneStatsComponent>;
    let gameServiceMock: SpyObj<GameService>;
    let timeServiceMock: SpyObj<TimeService>;

    beforeEach(() => {
        timeServiceMock = jasmine.createSpyObj('TimeService', ['subscribeToGameService', 'getTime']);
        timeServiceMock.getTime.and.returnValue(of(0));
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionZoneStatsComponent, HistogramComponent, GamePlayersListComponent],
            imports: [NgChartsModule],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } },
                { provide: GameService, useValue: gameServiceMock },
                { provide: TimeService, useValue: timeServiceMock },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(QuestionZoneStatsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
