import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GamePlayersListComponent } from '@app/components/game-players-list/game-players-list.component';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { GameService } from '@app/services/game.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { NgChartsModule } from 'ng2-charts';
import { of } from 'rxjs';
import { QuestionZoneStatsComponent } from './question-zone-stats.component';
import SpyObj = jasmine.SpyObj;

describe('QuestionZoneStatsComponent', () => {
    let component: QuestionZoneStatsComponent;
    let fixture: ComponentFixture<QuestionZoneStatsComponent>;
    let gameServiceMock: SpyObj<GameService>;
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
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on']);
        gameServiceMock = jasmine.createSpyObj('GameService', ['getQuizById']);
        gameServiceMock.getQuizById.and.returnValue(Promise.resolve(mockedQuiz));
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
            imports: [NgChartsModule],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' } } } },
                { provide: GameService, useValue: gameServiceMock },
                { provide: SocketClientService, useValue: clientSocketServiceMock },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(QuestionZoneStatsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch the quiz ', () => {
        component['getQuiz']();
        expect(gameServiceMock.getQuizById).toHaveBeenCalledWith(mockedQuiz.id);
    });
});
