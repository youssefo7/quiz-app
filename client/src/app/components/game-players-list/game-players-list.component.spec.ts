// any est necessaire pour pourvoir test les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ChatEvents } from '@common/chat.events';
import { GameEvents } from '@common/game.events';
import { Results } from '@common/player-info';
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
    let mockSocketClientService: MockSocketClientService;
    let socketHelper: SocketTestHelper;
    let routerSpy: SpyObj<Router>;

    const playersListMock: Results[] = [
        { name: 'Marie', points: 10, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: false, bonusCount: 0 },
        { name: 'Liam', points: 20, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: false, bonusCount: 0 },
        { name: 'Alicia', points: 20, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: false, bonusCount: 0 },
        { name: 'Zane', points: 50, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: false, bonusCount: 0 },
    ];

    const roomPlayersNamesMock: string[] = ['Marie', 'Liam', 'Alicia', 'Zane'];

    const response = {
        pointsToAdd: 10,
        name: 'Marie',
    };

    beforeEach(() => {
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getRoomPlayers', 'getPlayerResults', 'sendPlayerResults']);
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
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePlayersListComponent);
        component = fixture.componentInstance;
        component.playerResults = [...playersListMock];
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

    it('should fetch players list and populate playerResults', async () => {
        component.isResultsRoute = false;
        component.roomId = '123';
        component.playerResults = playersListMock;
        await component.fetchPlayersList();

        expect(roomCommunicationServiceMock.getRoomPlayers).toHaveBeenCalledWith('123');
        expect(component.playerResults.length).toBe(playersListMock.length);

        component.isResultsRoute = true;
        await component.fetchPlayersList();

        expect(component.playerResults).toEqual(playersListMock);
        expect(roomCommunicationServiceMock.getPlayerResults).toHaveBeenCalled();
    });

    it('should send ShowResults event when SendResults event is received and redirect users to the results page', async () => {
        const sendSpy = spyOn(mockSocketClientService, 'send');
        component.roomId = '456';

        component['listenToSocketEvents']();
        socketHelper.peerSideEmit(GameEvents.SendResults);

        await component.fetchPlayersList();
        expect(roomCommunicationServiceMock.sendPlayerResults).toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalledWith(GameEvents.ShowResults, '456');
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(`/results/game/${component['quizId']}/room/${component.roomId}/host`);
    });

    it('should sort players by name', () => {
        const sortSpy = spyOn(component.playerResults, 'sort').and.callThrough();
        component.sortByName();
        expect(sortSpy).toHaveBeenCalled();
    });

    it('should sort players by points', () => {
        const ascendingBefore = component.shouldSortPointsAscending;
        const sortSpy = spyOn(component.playerResults, 'sort').and.callThrough();
        component.sortByPoints();
        expect(sortSpy).toHaveBeenCalled();
        expect(component.shouldSortPointsAscending).not.toEqual(ascendingBefore);
    });

    it('should sort players by state', () => {
        const sortSpy = spyOn(component.playerResults, 'sort').and.callThrough();
        component.sortByState();
        expect(sortSpy).toHaveBeenCalled();
    });

    it('should toggle chatting rights and send ToggleChattingRights event', () => {
        const playerName = 'testPlayer';
        const initialCanChat = component.canChat;
        const sendSpy = spyOn(mockSocketClientService, 'send');

        component.toggleChattingRights(playerName);
        expect(sendSpy).toHaveBeenCalledWith(ChatEvents.ToggleChattingRights, { roomId: component.roomId, playerName });
        expect(component.canChat).toBe(!initialCanChat);
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
        expect(component.getPlayerPriority(statePlayer)).toEqual(3);

        statePlayer.hasAbandoned = false;
        expect(component.getPlayerPriority(statePlayer)).toEqual(0);

        statePlayer.hasClickedOnAnswerField = true;
        expect(component.getPlayerPriority(statePlayer)).toEqual(1);

        statePlayer.hasConfirmedAnswer = true;
        expect(component.getPlayerPriority(statePlayer)).toEqual(2);
    });

    it('should update player status when abandonedGame event is received', () => {
        component.playerResults = playersListMock;
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
        component.playerResults = playersListMock;
        const playerIndex = component.playerResults.findIndex((player) => player.name === response.name);
        const previousScore = component.playerResults[playerIndex].points;
        const updateScoreSpy = spyOn<any>(component, 'updatePlayerScore').and.callThrough();

        component['listenToSocketEvents']();
        socketHelper.peerSideEmit(GameEvents.AddPointsToPlayer, response);

        expect(updateScoreSpy).toHaveBeenCalled();
        expect(component.playerResults[playerIndex].points).toBe(previousScore + response.pointsToAdd);
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

    it("should call updateAnswerConfirmation() if SubmitQuestionOnClick event is received and update the player's answer confirmation status", () => {
        component.playerResults = playersListMock;
        const playerToUpdate = playersListMock[0];
        const updateAnswerConfirmationSpy = spyOn<any>(component, 'updateAnswerConfirmation').and.callThrough();
        component['listenToSocketEvents']();

        socketHelper.peerSideEmit(GameEvents.SubmitQuestionOnClick, playerToUpdate.name);
        expect(updateAnswerConfirmationSpy).toHaveBeenCalledWith(playerToUpdate.name);
        expect(playerToUpdate.hasConfirmedAnswer).toBeTruthy();
    });

    it("should call updatePlayerInteraction() when FieldInteraction event is received and update the player's interaction status", () => {
        component.playerResults = playersListMock;
        const playerToUpdate = playersListMock[0];
        const updatePlayerInteractionSpy = spyOn<any>(component, 'updatePlayerInteraction').and.callThrough();
        component['listenToSocketEvents']();

        socketHelper.peerSideEmit(GameEvents.FieldInteraction, playerToUpdate.name);
        expect(updatePlayerInteractionSpy).toHaveBeenCalledWith(playerToUpdate.name);
        expect(playerToUpdate.hasClickedOnAnswerField).toBeTruthy();
    });

    it("should call resetPlayersInfo() if NextQuestion event is received and update the player's answer confirmation and interaction status", () => {
        const resetPlayerInfoSpy = spyOn<any>(component, 'resetPlayersInfo').and.callThrough();
        component['listenToSocketEvents']();

        socketHelper.peerSideEmit(GameEvents.NextQuestion);
        expect(resetPlayerInfoSpy).toHaveBeenCalled();
        component.playerResults.forEach((player) => {
            expect(player.hasClickedOnAnswerField).toBeFalsy();
            expect(player.hasConfirmedAnswer).toBeFalsy();
        });
    });
});
