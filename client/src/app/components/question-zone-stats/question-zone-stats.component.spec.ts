import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { GamePlayersListComponent } from '@app/components/game-players-list/game-players-list.component';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { NgChartsModule } from 'ng2-charts';
import { of } from 'rxjs';
import { QuestionZoneStatsComponent } from './question-zone-stats.component';
import SpyObj = jasmine.SpyObj;

describe('QuestionZoneStatsComponent', () => {
    let component: QuestionZoneStatsComponent;
    let fixture: ComponentFixture<QuestionZoneStatsComponent>;
    let clientSocketServiceMock: SpyObj<SocketClientService>;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;
    const mockedQuiz = {
        $schema: 'test.json',
        id: '123',
        title: 'Test quiz',
        description: 'Test quiz description',
        visibility: true,
        duration: 60,
        lastModification: '2018-11-13T20:20:39+00:00',
        questions: [],
    };

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists']);
        clientSocketServiceMock.socketExists.and.returnValue(true);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getRoomPlayers']);
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(
            of([
                /* liste vide de joueur */
            ]),
        );
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionZoneStatsComponent, HistogramComponent, GamePlayersListComponent],
            imports: [NgChartsModule, HttpClientTestingModule],
            providers: [
                { provide: SocketClientService, useValue: clientSocketServiceMock },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ roomId: 'roomId' }),
                            url: ['host'],
                        },
                    },
                },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(QuestionZoneStatsComponent);
        component = fixture.componentInstance;

        component.quiz = mockedQuiz;
        component.roomId = '123';
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
