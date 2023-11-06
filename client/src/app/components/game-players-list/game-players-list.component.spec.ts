// any est necessaire pour pourvoir test les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GameEvents } from '@app/events/game.events';
import { PlayerInfo } from '@app/interfaces/player-info';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { of } from 'rxjs';
import { GamePlayersListComponent } from './game-players-list.component';

describe('GamePlayersListComponent', () => {
    let component: GamePlayersListComponent;
    let fixture: ComponentFixture<GamePlayersListComponent>;
    let clientSocketServiceMock: jasmine.SpyObj<SocketClientService>;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;

    const playersListMock: PlayerInfo[] = [
        { name: 'Marc', hasAbandoned: false, score: 10, bonusCount: 0 },
        { name: 'Liam', hasAbandoned: false, score: 20, bonusCount: 0 },
        { name: 'Adam', hasAbandoned: false, score: 20, bonusCount: 0 },
        { name: 'Zane', hasAbandoned: false, score: 50, bonusCount: 0 },
    ];

    const response = {
        pointsToAdd: 10,
        name: 'Marc',
    };

    beforeEach(waitForAsync(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on']);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getRoomPlayers']);
        TestBed.configureTestingModule({
            declarations: [GamePlayersListComponent],
            providers: [
                {
                    provide: SocketClientService,
                    useValue: clientSocketServiceMock,
                },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'results' }] } } },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
            ],
        });
        fixture = TestBed.createComponent(GamePlayersListComponent);
        component = fixture.componentInstance;
        component.playersList = playersListMock;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('isResultsPage() should return isResultsRoute value', () => {
        component['isResultsRoute'] = true;
        expect(component['isResultsPage']()).toBe(true);

        component['isResultsRoute'] = false;
        expect(component['isResultsPage']()).toBe(false);
    });

    it('sortPlayers() should  only be called if isResultsRoute is true', async () => {
        const sortPlayersSpy = spyOn<any>(component, 'sortPlayers');
        component['isResultsRoute'] = false;
        await component.ngOnInit();
        expect(sortPlayersSpy).not.toHaveBeenCalled();

        component['isResultsRoute'] = true;
        await component.ngOnInit();
        expect(sortPlayersSpy).toHaveBeenCalled();
    });

    it('should fetch players list', async () => {
        roomCommunicationServiceMock.getRoomPlayers.and.returnValue(of(playersListMock.map((player) => player.name)));
        await component.fetchPlayersList();

        expect(roomCommunicationServiceMock.getRoomPlayers).toHaveBeenCalledWith('123');
        expect(component.playersList.length).toBe(playersListMock.length);
    });

    it('sortPlayers() should sort playersList by score in ascending order', () => {
        component['sortPlayers']();
        const bestPlayerName = 'Zane';

        expect(component.playersList[0].name).toEqual(bestPlayerName);
    });

    it('sortPlayers() should sort two players with the same score in alphabetical order', () => {
        component['sortPlayers']();

        const tiedPlayer1 = 'Adam';
        const tiedPlayer2 = 'Liam';

        expect(component.playersList[1].name).toEqual(tiedPlayer1);
        expect(component.playersList[2].name).toEqual(tiedPlayer2);
    });

    it('should call "updatePlayerScore" when "addPointsToPlayer" event is received', () => {
        const updatePayerScoreSpy = spyOn<any>(component, 'updatePlayerScore');

        const updateScoreCallback = clientSocketServiceMock.on.calls.mostRecent().args[1];
        updateScoreCallback(response);

        expect(updatePayerScoreSpy).toHaveBeenCalledWith(response);
    });

    it('should update player status when abandonedGame event is received', () => {
        const playerName = 'Marc';

        clientSocketServiceMock.on.and.callFake((eventName) => {
            if (eventName === GameEvents.PlayerAbandonedGame) {
                component['updatePlayerStatus'](playerName);
            }
        });

        clientSocketServiceMock.on.calls.reset();
        component.listenToSocketEvents();

        const abandonedPlayer = component.playersList.find((player) => player.name === response.name) as PlayerInfo;
        const activePlayer = component.playersList.find((player) => player.name === 'Zane') as PlayerInfo;

        expect(abandonedPlayer.hasAbandoned).toBe(true);
        expect(activePlayer.hasAbandoned).toBe(false);
    });

    it('should update player score when addPointsToPlayer event is received', () => {
        clientSocketServiceMock.on.and.callFake((eventName) => {
            if (eventName === GameEvents.AddPointsToPlayer) {
                component['updatePlayerScore'](response);
            }
        });

        clientSocketServiceMock.on.calls.reset();
        component.listenToSocketEvents();

        const addedPointsPlayer = component.playersList.find((player) => player.name === response.name) as PlayerInfo;
        const noAddedPointsPlayer = component.playersList.find((player) => player.name === 'Zane') as PlayerInfo;

        const newScore = 20;
        const oldScore = 50;

        expect(addedPointsPlayer.score).toBe(newScore);
        expect(noAddedPointsPlayer.score).toBe(oldScore);
    });
});
