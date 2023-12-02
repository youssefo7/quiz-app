import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { PlayerSubmission } from '@common/player-submission';
import { EvaluationZoneComponent } from './evaluation-zone.component';

class MockSocketClientService extends SocketClientService {
    private mockSocketExists = true;

    override connect() {
        // vide
    }

    override socketExists() {
        return this.mockSocketExists;
    }

    setSocketExists(value: boolean) {
        this.mockSocketExists = value;
    }
}

describe('EvaluationZoneComponent', () => {
    let component: EvaluationZoneComponent;
    let fixture: ComponentFixture<EvaluationZoneComponent>;
    let clientSocketServiceMock: MockSocketClientService;
    let chartDataManagerServiceMock: jasmine.SpyObj<ChartDataManagerService>;
    const mockedAnswers: PlayerSubmission[] = [
        { name: 'test1', answer: 'test1', hasSubmittedBeforeEnd: true },
        { name: 'test2', answer: 'test2', hasSubmittedBeforeEnd: true },
        { name: 'test3', answer: 'test3', hasSubmittedBeforeEnd: true },
    ];

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on']);
        chartDataManagerServiceMock = jasmine.createSpyObj('ChartDataManagerService', ['saveChartData']);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [EvaluationZoneComponent],
            providers: [
                { provide: SocketClientService, useValue: clientSocketServiceMock },
                { provide: ChartDataManagerService, useValue: chartDataManagerServiceMock },
            ],
        });
        fixture = TestBed.createComponent(EvaluationZoneComponent);
        component = fixture.componentInstance;
        component.answers = mockedAnswers;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});