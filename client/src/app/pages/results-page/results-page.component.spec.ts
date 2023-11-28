import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { GamePlayersListComponent } from '@app/components/game-players-list/game-players-list.component';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { ResultChartComponent } from '@app/components/result-chart/result-chart.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { HistoryCommunicationService } from '@app/services/history-communication.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { NgChartsModule } from 'ng2-charts';
import { ResultsPageComponent } from './results-page.component';

describe('ResultsPageComponent', () => {
    let component: ResultsPageComponent;
    let fixture: ComponentFixture<ResultsPageComponent>;
    let clientSocketServiceMock: jasmine.SpyObj<SocketClientService>;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;
    let historyCommunicationServiceMock: jasmine.SpyObj<HistoryCommunicationService>;

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists', 'connect', 'disconnect', 'send']);
        clientSocketServiceMock.socketExists.and.returnValue(true);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getRoomPlayers']);
        TestBed.configureTestingModule({
            declarations: [
                ResultsPageComponent,
                GamePlayersListComponent,
                MatIcon,
                TopBarComponent,
                ChatComponent,
                ResultChartComponent,
                HistogramComponent,
            ],
            imports: [FormsModule, NgChartsModule],
            providers: [
                {
                    provide: SocketClientService,
                    useValue: clientSocketServiceMock,
                },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
                { provide: HistoryCommunicationService, useValue: historyCommunicationServiceMock },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'results' }] } } },
            ],
        });
        fixture = TestBed.createComponent(ResultsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
