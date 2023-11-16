// any est necessaire pour pourvoir test les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Results } from '@app/interfaces/player-info';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { GamePlayersListComponent } from './game-players-list.component';

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

describe('GamePlayersListComponent', () => {
    let component: GamePlayersListComponent;
    let fixture: ComponentFixture<GamePlayersListComponent>;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;
    let mockSocketClientService: MockSocketClientService;
    let socketHelper: SocketTestHelper;

    const playersListMock: Results[] = [
        { name: 'Marc', points: 10, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: false, bonusCount: 0 },
        { name: 'Liam', points: 20, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: false, bonusCount: 0 },
        { name: 'Adam', points: 20, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: false, bonusCount: 0 },
        { name: 'Zane', points: 50, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: false, bonusCount: 0 },
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
        mockSocketClientService = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists']);
    });

    beforeEach(waitForAsync(() => {
        socketHelper = new SocketTestHelper();
        mockSocketClientService = new MockSocketClientService();
        mockSocketClientService.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [GamePlayersListComponent, MatIcon],
            providers: [
                { provide: SocketClientService, useValue: mockSocketClientService },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: convertToParamMap({ quizId: '123', roomId: '456' }), url: [{ path: 'results' }] } },
                },
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

    it('should fetch players list and call listenToSocketEvents() if socket exists', async () => {
        const fetchPlayersListSpy = spyOn(component, 'fetchPlayersList').and.resolveTo();
        const listenToSocketEventSpy = spyOn(component, 'listenToSocketEvents');

        await component.ngOnInit();

        expect(fetchPlayersListSpy).toHaveBeenCalled();
        expect(listenToSocketEventSpy).toHaveBeenCalled();
    });

    it('should not fetch players list or call listenToSocketEvents() if socket does not exist', async () => {
        const fetchPlayersListSpy = spyOn(component, 'fetchPlayersList');
        const listenToSocketEventSpy = spyOn(component, 'listenToSocketEvents');
        mockSocketClientService.setSocketExists(false);

        await component.ngOnInit();

        expect(fetchPlayersListSpy).not.toHaveBeenCalled();
        expect(listenToSocketEventSpy).not.toHaveBeenCalled();
    });

    it('should fetch players list', async () => {
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

    it('should sort by names in ascending and descending order', () => {
        // TODO
    });

    it('should sort by points in ascending and descending order', () => {
        // TODO
    });

    it('should sort by state in ascending and descending order', () => {
        // TODO
    });

    it('should get player priority', () => {
        // TODO
    });

    it('should update player status when abandonedGame event is received', () => {
        const updateStatusSpy = spyOn<any>(component, 'updatePlayerStatus').and.callThrough();

        component.listenToSocketEvents();
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

        component.listenToSocketEvents();
        socketHelper.peerSideEmit(GameEvents.AddPointsToPlayer, response);

        expect(updateScoreSpy).toHaveBeenCalled();
        expect(component.playerResults[playerIndex].points).toBe(previousScore + response.pointsToAdd);
    });

    it('should call updatePlayerBonusCount() when BonusUpdate event is received', () => {
        const updatePlayerBonusSpy = spyOn<any>(component, 'updatePlayerBonusCount').and.callThrough();
        component.listenToSocketEvents();
        socketHelper.peerSideEmit(GameEvents.BonusUpdate, response.name);
        expect(updatePlayerBonusSpy).toHaveBeenCalled();
    });

    it('should call updateAnswerConfirmation() when SubmitQuestionOnClick event is received', () => {
        const updateAnswerConfirmationSpy = spyOn<any>(component, 'updateAnswerConfirmation').and.callThrough();
        component.listenToSocketEvents();
        socketHelper.peerSideEmit(GameEvents.SubmitQuestionOnClick);
        expect(updateAnswerConfirmationSpy).toHaveBeenCalled();
    });

    it('should call updatePlayerInteraction() when QuestionChoiceSelect event is received', () => {
        const updatePlayerInteractionSpy = spyOn<any>(component, 'updatePlayerInteraction').and.callThrough();
        component.listenToSocketEvents();
        socketHelper.peerSideEmit(GameEvents.QuestionChoiceSelect);
        expect(updatePlayerInteractionSpy).toHaveBeenCalled();
    });

    it('should call resetPlayersInfo() when NextQuestion event is received', () => {
        const resetPlayerInfoSpy = spyOn<any>(component, 'resetPlayersInfo').and.callThrough();
        component.listenToSocketEvents();
        socketHelper.peerSideEmit(GameEvents.NextQuestion);
        expect(resetPlayerInfoSpy).toHaveBeenCalled();
    });
});
