// Raison: Tests necessaire dépassent la limite
/* eslint-disable max-lines */
// any est necessaire pour pourvoir test les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Quiz } from '@app/interfaces/quiz';
import { HistoryCommunicationService } from '@app/services/history-communication.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ChatEvents } from '@common/chat.events';
import { GameEvents } from '@common/game.events';
import { Results } from '@common/player-info';
import { TimeEvents } from '@common/time.events';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { GamePlayersListComponent } from './game-players-list.component';
import SpyObj = jasmine.SpyObj;

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
    let historyCommunicationServiceMock: jasmine.SpyObj<HistoryCommunicationService>;
    let mockSocketClientService: MockSocketClientService;
    let socketHelper: SocketTestHelper;
    let routerSpy: SpyObj<Router>;

    const playersListMock: Results[] = [
        { name: 'Marie', points: 0, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: false, bonusCount: 0 },
        { name: 'Liam', points: 0, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: false, bonusCount: 0 },
        { name: 'Alicia', points: 0, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: false, bonusCount: 0 },
        { name: 'Zane', points: 0, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: false, bonusCount: 0 },
    ];

    const roomPlayersNamesMock: string[] = ['Marie', 'Liam', 'Alicia', 'Zane'];

    const response = {
        pointsToAdd: 10,
        name: 'Marie',
    };

    beforeEach(() => {
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', [
            'getRoomPlayers',
            'getPlayerResults',
            'sendPlayerResults',
            'getRoomQuiz',
        ]);
        historyCommunicationServiceMock = jasmine.createSpyObj('HistoryCommunicationService', ['addHistory']);
        mockSocketClientService = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
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
                    useValue: { snapshot: { paramMap: convertToParamMap({ quizId: '123', roomId: '456' }), url: [] } },
                },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
                { provide: Router, useValue: routerSpy },
                { provide: HistoryCommunicationService, useValue: historyCommunicationServiceMock },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePlayersListComponent);
        component = fixture.componentInstance;
        roomCommunicationServiceMock.sendPlayerResults.and.returnValue(of(playersListMock));
        roomCommunicationServiceMock.getPlayerResults.and.returnValue(of(playersListMock));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch players list and call listenToSocketEvents() if socket exists', async () => {
        const fetchPlayersListSpy = spyOn(component, 'fetchPlayersList').and.resolveTo();
        const listenToSocketEventSpy = spyOn<any>(component, 'listenToSocketEvents');
        await component.ngOnInit();

        expect(fetchPlayersListSpy).toHaveBeenCalled();
        expect(listenToSocketEventSpy).toHaveBeenCalled();
    });

    it('should not fetch players list or call listenToSocketEvents() if socket does not exist', async () => {
        const fetchPlayersListSpy = spyOn(component, 'fetchPlayersList');
        const listenToSocketEventSpy = spyOn<any>(component, 'listenToSocketEvents');
        mockSocketClientService.setSocketExists(false);
        await component.ngOnInit();

        expect(fetchPlayersListSpy).not.toHaveBeenCalled();
        expect(listenToSocketEventSpy).not.toHaveBeenCalled();
    });

    it('should sort players by points when in result route', async () => {
        const sortPointsSpy = spyOn(component, 'sortByPoints').and.callThrough();
        component.isResultsRoute = true;
        await component.ngOnInit();
        expect(sortPointsSpy).toHaveBeenCalled();
    });

    it('should fetch players list and populate playerResults', async () => {
        component.isResultsRoute = false;
        component.roomId = '123';
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(of(roomPlayersNamesMock));
        await component.fetchPlayersList();

        expect(roomCommunicationServiceMock.getRoomPlayers).toHaveBeenCalledWith('123');
        expect(component.playerResults.length).toBe(playersListMock.length);

        component.isResultsRoute = true;
        await component.fetchPlayersList();
        expect(roomCommunicationServiceMock.getPlayerResults).toHaveBeenCalled();
    });

    it('should send ShowResults event when SendResults event is received and redirect users to the results page', async () => {
        const sendSpy = spyOn(mockSocketClientService, 'send');
        component.roomId = '456';
        const addHistorySpy = spyOn<any>(component, 'addGameToHistory');

        component['listenToSocketEvents']();
        socketHelper.peerSideEmit(GameEvents.SendResults);
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(of(roomPlayersNamesMock));
        await component.fetchPlayersList();

        expect(roomCommunicationServiceMock.sendPlayerResults).toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.ShowResults, '456');
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(`/results/game/${component['quizId']}/room/${component.roomId}/host`);
        expect(addHistorySpy).toHaveBeenCalled();
    });

    it('should sort players by name in ascending and descending order', async () => {
        const ascendingBefore = component.shouldSortNamesAscending;
        const sortSpy = spyOn(component.playerResults, 'sort').and.callThrough();
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(of(roomPlayersNamesMock));
        await component.fetchPlayersList();

        component.sortByName();
        expect(sortSpy).toHaveBeenCalled();
        expect(component.playerResults[0].name).toEqual('Alicia');
        expect(component.playerResults[1].name).toEqual('Liam');
        expect(component.playerResults[2].name).toEqual('Marie');
        expect(component.playerResults[3].name).toEqual('Zane');

        component.sortByName();
        expect(component.shouldSortNamesAscending).toEqual(ascendingBefore);
        expect(component.playerResults[3].name).toEqual('Alicia');
        expect(component.playerResults[2].name).toEqual('Liam');
        expect(component.playerResults[1].name).toEqual('Marie');
        expect(component.playerResults[0].name).toEqual('Zane');
    });

    it('should sort players by points in ascending and descending order, or alphabetical order when they have the same score', async () => {
        const ascendingBefore = component.shouldSortPointsAscending;
        const sortSpy = spyOn(component.playerResults, 'sort').and.callThrough();

        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(of(roomPlayersNamesMock));
        await component.fetchPlayersList();

        component.playerResults[0].points = 50;
        component.playerResults[1].points = 100;
        component.sortByPoints();

        expect(sortSpy).toHaveBeenCalled();
        expect(component.playerResults[2].points).toBeLessThan(component.playerResults[3].points);
        expect(component.shouldSortPointsAscending).not.toEqual(ascendingBefore);
        expect(component.playerResults[0].name).toEqual('Alicia');
        expect(component.playerResults[1].name).toEqual('Zane');
        expect(component.playerResults[2].name).toEqual('Marie');
        expect(component.playerResults[3].name).toEqual('Liam');

        component.sortByPoints();
        expect(component.shouldSortPointsAscending).toEqual(ascendingBefore);
        expect(component.playerResults[1].points).toBeLessThan(component.playerResults[0].points);
        expect(component.playerResults[0].name).toEqual('Liam');
        expect(component.playerResults[1].name).toEqual('Marie');
        expect(component.playerResults[2].name).toEqual('Alicia');
        expect(component.playerResults[3].name).toEqual('Zane');
    });

    it('should sort players by state', async () => {
        const sortSpy = spyOn(component.playerResults, 'sort').and.callThrough();
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(of(roomPlayersNamesMock));
        await component.fetchPlayersList();

        component.playerResults[3].hasConfirmedAnswer = true;
        component.playerResults[2].hasClickedOnAnswerField = true;
        component.playerResults[1].hasAbandoned = true;

        component.sortByState();
        expect(sortSpy).toHaveBeenCalled();
        expect(component.playerResults[0].name).toEqual('Marie');
        expect(component.playerResults[1].name).toEqual('Alicia');
        expect(component.playerResults[2].name).toEqual('Zane');
        expect(component.playerResults[3].name).toEqual('Liam');

        component.playerResults[0].hasAbandoned = true;
        component.sortByState();
        expect(component.playerResults[3].name).toEqual('Alicia');
        expect(component.playerResults[2].name).toEqual('Zane');
        expect(component.playerResults[1].name).toEqual('Marie');
        expect(component.playerResults[0].name).toEqual('Liam');
    });

    it('should toggle chatting rights and send ToggleChattingRights event', () => {
        const playerName = 'testPlayer';
        const sendSpy = spyOn(mockSocketClientService, 'send');
        component.toggleChattingRights(playerName);
        expect(sendSpy).toHaveBeenCalledWith(ChatEvents.ToggleChattingRights, { roomId: component.roomId, playerName });
    });

    it("should return the correct player priority depending on the player's state", () => {
        const statePlayer = {
            name: 'testPlayer',
            points: 10,
            hasAbandoned: false,
            hasClickedOnAnswerField: false,
            hasConfirmedAnswer: false,
            bonusCount: 0,
        };

        statePlayer.hasAbandoned = true;
        expect(component['getPlayerPriority'](statePlayer)).toEqual(3);

        statePlayer.hasAbandoned = false;
        expect(component['getPlayerPriority'](statePlayer)).toEqual(0);

        statePlayer.hasClickedOnAnswerField = true;
        expect(component['getPlayerPriority'](statePlayer)).toEqual(1);

        statePlayer.hasConfirmedAnswer = true;
        expect(component['getPlayerPriority'](statePlayer)).toEqual(2);
    });

    it('should update player status when abandonedGame event is received and sort the player in the correct order', () => {
        component['isSortedByState'] = true;
        component['shouldSortStatesAscending'] = true;
        component.playerResults = playersListMock;
        const updateStatusSpy = spyOn<any>(component, 'markAsAbandoned').and.callThrough();
        const sortSpy = spyOn<any>(component, 'sortByState').and.callThrough();

        component['listenToSocketEvents']();
        socketHelper.peerSideEmit(GameEvents.PlayerAbandonedGame, response.name);
        const abandonedPlayer = component.playerResults.find((player) => player.name === response.name) as Results;
        const activePlayer = component.playerResults.find((player) => player.name === 'Zane') as Results;

        expect(updateStatusSpy).toHaveBeenCalled();
        expect(sortSpy).toHaveBeenCalled();
        expect(abandonedPlayer.hasAbandoned).toBe(true);
        expect(activePlayer.hasAbandoned).toBe(false);
    });

    it('should update player score when AddPointsToPlayer event is received', () => {
        component['isSortedByPoints'] = true;
        component['shouldSortPointsAscending'] = true;
        component.playerResults = playersListMock;
        const updateScoreSpy = spyOn<any>(component, 'updatePlayerScore').and.callThrough();
        const sortSpy = spyOn<any>(component, 'sortByPoints').and.callThrough();

        component['listenToSocketEvents']();
        socketHelper.peerSideEmit(GameEvents.AddPointsToPlayer, response);
        expect(sortSpy).toHaveBeenCalled();
        expect(updateScoreSpy).toHaveBeenCalled();
    });

    it('should call updatePlayerBonusCount() when BonusUpdate event is received', () => {
        component.playerResults = playersListMock;
        const playerToUpdate = playersListMock[0];
        const oldBonusCount = playersListMock[0].bonusCount;
        const updatePlayerBonusSpy = spyOn<any>(component, 'updatePlayerBonusCount').and.callThrough();
        component['listenToSocketEvents']();

        socketHelper.peerSideEmit(GameEvents.BonusUpdate, playerToUpdate.name);
        expect(updatePlayerBonusSpy).toHaveBeenCalled();
        expect(playerToUpdate.bonusCount).not.toEqual(oldBonusCount);
    });

    it('should update answer confirmation and possibly sort by state', () => {
        component['isSortedByState'] = true;
        component['shouldSortStatesAscending'] = true;
        component.playerResults = playersListMock;
        const playerToUpdate = playersListMock[0];
        const updateAnswerConfirmationSpy = spyOn<any>(component, 'updateAnswerConfirmation').and.callThrough();
        const sortByStateSpy = spyOn(component, 'sortByState').and.callThrough();
        component['listenToSocketEvents']();

        socketHelper.peerSideEmit(GameEvents.SubmitAnswer, { name: playerToUpdate.name, hasSubmittedBeforeEnd: true });
        expect(updateAnswerConfirmationSpy).toHaveBeenCalledWith(playerToUpdate.name);
        expect(playerToUpdate.hasConfirmedAnswer).toBeTruthy();
        expect(sortByStateSpy).toHaveBeenCalled();
    });

    it("should call updatePlayerInteraction() when FieldInteraction event is received, sort and update the player's interaction status", () => {
        component['isSortedByState'] = true;
        component['shouldSortStatesAscending'] = true;
        component.playerResults = playersListMock;
        const playerToUpdate = playersListMock[0];
        const updatePlayerInteractionSpy = spyOn<any>(component, 'updatePlayerInteraction').and.callThrough();
        const sortSpy = spyOn<any>(component, 'sortByState').and.callThrough();
        component['listenToSocketEvents']();

        socketHelper.peerSideEmit(GameEvents.FieldInteraction, playerToUpdate.name);
        expect(updatePlayerInteractionSpy).toHaveBeenCalledWith(playerToUpdate.name);
        expect(playerToUpdate.hasClickedOnAnswerField).toBeTruthy();
        expect(sortSpy).toHaveBeenCalled();
    });

    it("should call resetPlayersInfo() if TransitionClockFinished event is received, sort and update the player's status", async () => {
        component['isSortedByState'] = true;
        component['shouldSortStatesAscending'] = true;
        const resetPlayerInfoSpy = spyOn<any>(component, 'resetPlayersInfo').and.callThrough();
        const isTransitionTimer = true;
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(of(roomPlayersNamesMock));

        await component.fetchPlayersList();
        const sortSpy = spyOn<any>(component, 'sortByState').and.callThrough();
        component['listenToSocketEvents']();

        socketHelper.peerSideEmit(TimeEvents.TimerFinished, isTransitionTimer);
        expect(resetPlayerInfoSpy).toHaveBeenCalled();
        component.playerResults.forEach((player) => {
            expect(player.hasClickedOnAnswerField).toBeFalsy();
            expect(player.hasConfirmedAnswer).toBeFalsy();
        });
        expect(sortSpy).toHaveBeenCalled();
    });

    it('should add to history', async () => {
        component.playerResults = [...playersListMock];
        component.playerResults[3].points = 100;
        component.roomId = '123';
        component['currentDateTime'] = '2011-10-05T14:48:00.000Z';
        const mockQuiz = { title: 'Test Quiz' };
        const expectedHistory = {
            name: mockQuiz.title,
            date: '2011-10-05 14:48:00',
            numberOfPlayers: component.playerResults.length,
            maxScore: component.playerResults[3].points,
        };

        roomCommunicationServiceMock.getRoomQuiz.and.returnValue(of(mockQuiz as Quiz));
        historyCommunicationServiceMock.addHistory.and.returnValue(of(expectedHistory));
        await component['addGameToHistory']();

        expect(roomCommunicationServiceMock.getRoomQuiz).toHaveBeenCalledWith(component.roomId);
        expect(historyCommunicationServiceMock.addHistory).toHaveBeenCalledWith(expectedHistory);
    });
});
