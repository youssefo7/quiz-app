// any est necessaire pour pourvoir test les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Results } from '@common/player-info';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { GamePlayersListComponent } from './game-players-list.component';

class MockSocketClientService extends SocketClientService {
    override connect() {
        // vide
    }
}

describe('GamePlayersListComponent', () => {
    let component: GamePlayersListComponent;
    let fixture: ComponentFixture<GamePlayersListComponent>;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;
    let mockSocketClientService: MockSocketClientService;
    let socketHelper: SocketTestHelper;

    const playersListMock: Results[] = [
        { name: 'Marc', hasAbandoned: false, hasConfirmedAnswer: false, hasClickedOnAnswerField: false, points: 10, bonusCount: 0 },
        { name: 'Liam', hasAbandoned: false, hasConfirmedAnswer: false, hasClickedOnAnswerField: false, points: 20, bonusCount: 0 },
        { name: 'Adam', hasAbandoned: false, hasConfirmedAnswer: false, hasClickedOnAnswerField: false, points: 20, bonusCount: 0 },
        { name: 'Zane', hasAbandoned: false, hasConfirmedAnswer: false, hasClickedOnAnswerField: false, points: 50, bonusCount: 0 },
    ];

    const roomPlayersNamesMock: string[] = ['Marc', 'Liam', 'Adam', 'Zane'];

    const response = {
        pointsToAdd: 10,
        name: 'Marc',
    };

    beforeEach(() => {
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', [
            'getRoomPlayers',
            'getPlayerResults',
            'sendPlayerResults',
            'createRoom',
        ]);
        mockSocketClientService = jasmine.createSpyObj('SocketClientService', ['on']);
    });

    beforeEach(waitForAsync(() => {
        socketHelper = new SocketTestHelper();
        mockSocketClientService = new MockSocketClientService();
        mockSocketClientService.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [GamePlayersListComponent],
            providers: [
                { provide: SocketClientService, useValue: mockSocketClientService },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'results' }] } } },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePlayersListComponent);
        component = fixture.componentInstance;
        component.playerResults = playersListMock;
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(of(roomPlayersNamesMock));
        roomCommunicationServiceMock.sendPlayerResults.and.returnValue(of(playersListMock));
        roomCommunicationServiceMock.getPlayerResults.and.returnValue(of(playersListMock));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch the player list for a given room', async () => {
        component.isResultsRoute = false;
        component.roomId = '123';
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(of(playersListMock.map((player) => player.name)));
        await component.fetchPlayersList();

        expect(roomCommunicationServiceMock.getRoomPlayers).toHaveBeenCalledWith('123');
        expect(component.playerResults.length).toBe(playersListMock.length);

        component.isResultsRoute = true;
        await component.fetchPlayersList();
        roomCommunicationServiceMock.getPlayerResults.and.returnValue(of(playersListMock));
        expect(component.playerResults).toEqual(playersListMock);
        expect(roomCommunicationServiceMock.getPlayerResults).toHaveBeenCalled();
    });

    it('should update player status when abandonedGame event is received', () => {
        const updateStatusSpy = spyOn<any>(component, 'updatePlayerStatus').and.callThrough();

        component['listenToSocketEvents']();
        socketHelper.peerSideEmit(GameEvents.PlayerAbandonedGame, response.name);

        const abandonedPlayer = component.playerResults.find((player) => player.name === response.name) as Results;
        const activePlayer = component.playerResults.find((player) => player.name === 'Zane') as Results;

        expect(updateStatusSpy).toHaveBeenCalled();
        expect(abandonedPlayer.hasAbandoned).toBe(true);
        expect(activePlayer.hasAbandoned).toBe(false);
    });

    it('should update player score when AddPointsToPlayer event is received', () => {
        const playerIndex = component.playerResults.findIndex((player) => player.name === response.name);
        const previousScore = component.playerResults[playerIndex].points;
        const updateScoreSpy = spyOn<any>(component, 'updatePlayerScore').and.callThrough();

        component['listenToSocketEvents']();
        socketHelper.peerSideEmit(GameEvents.AddPointsToPlayer, response);

        expect(updateScoreSpy).toHaveBeenCalled();
        expect(component.playerResults[playerIndex].points).toBe(previousScore + response.pointsToAdd);
    });

    it('should call updatePlayerBonusCount when BonusUpdate event is received', () => {
        const updatePlayerBonusSpy = spyOn<any>(component, 'updatePlayerBonusCount').and.callThrough();
        component['listenToSocketEvents']();
        socketHelper.peerSideEmit(GameEvents.BonusUpdate, response.name);
        expect(updatePlayerBonusSpy).toHaveBeenCalled();
    });
});
