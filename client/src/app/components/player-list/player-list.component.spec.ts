// any est utilisé pour les tests, car les fonctions sont privées et ne peuvent pas être testées autrement
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { GameEvents } from '@app/events/game.events';
import { JoinEvents } from '@app/events/join.events';
import { TimeEvents } from '@app/events/time.events';
import { WaitingEvents } from '@app/events/waiting.events';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Socket } from 'socket.io-client';
import { PlayerListComponent } from './player-list.component';

import SpyObj = jasmine.SpyObj;

class MockSocketClientService extends SocketClientService {
    override connect() {
        // vide
    }
}

describe('PlayerListComponent', () => {
    let component: PlayerListComponent;
    let fixture: ComponentFixture<PlayerListComponent>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;
    let mockSocketClientService: MockSocketClientService;
    let mockRoomCommunicationService: RoomCommunicationService;
    let routerSpy: SpyObj<Router>;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['componentInstance']);
        mockSocketClientService = jasmine.createSpyObj('SocketClientService', ['on']);
    });

    beforeEach(waitForAsync(() => {
        socketHelper = new SocketTestHelper();
        mockSocketClientService = new MockSocketClientService();
        mockSocketClientService.socket = socketHelper as unknown as Socket;

        TestBed.configureTestingModule({
            declarations: [PlayerListComponent, MatIcon],
            providers: [
                { provide: MatDialog, useValue: mockDialog },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: convertToParamMap({ quizId: '123', roomId: '456' }), url: [] } },
                },
                { provide: SocketClientService, useValue: mockSocketClientService },
                { provide: RoomCommunicationService, useValue: mockRoomCommunicationService },
                { provide: Router, useValue: routerSpy },
            ],
            imports: [HttpClientTestingModule],
        }).compileComponents();
    }));

    beforeEach(() => {
        mockDialog.open.and.returnValue(mockDialogRef);
        fixture = TestBed.createComponent(PlayerListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should add player when PlayerHasJoined event is received', () => {
        socketHelper.peerSideEmit(JoinEvents.PlayerHasJoined, 'playerName');
        expect(component.players).toContain('playerName');
    });

    it('should send event BanName when player is banned', () => {
        const sendSpy = spyOn(mockSocketClientService, 'send');
        component.banPlayer('playerToBan');
        expect(sendSpy).toHaveBeenCalled();
    });

    it('should listen on event BanNotification and call banPopUp function', () => {
        const banPopupSpy = spyOn<any>(component, 'banPopup');
        socketHelper.peerSideEmit(GameEvents.BanNotification, 'playerToBan');
        expect(banPopupSpy).toHaveBeenCalled();
    });

    it('should listen on event BanName and remove banned player from the game and add him to the bannedPlayers list', () => {
        const removePlayerSpy = spyOn<any>(component, 'removePlayer').and.callThrough();
        socketHelper.peerSideEmit(WaitingEvents.BanName, 'playerToBan');
        expect(removePlayerSpy).toHaveBeenCalledWith('playerToBan');
        expect(component.bannedPlayers).toContain('playerToBan');
    });

    it('should remove player when PlayerAbandonedGame event is received', () => {
        const removePlayerSpy = spyOn<any>(component, 'removePlayer').and.callThrough();

        socketHelper.peerSideEmit(GameEvents.PlayerAbandonedGame, 'AbandonedPlayer');
        expect(removePlayerSpy).toHaveBeenCalledWith('AbandonedPlayer');
        expect(component.players).not.toContain('AbandonedPlayer');
    });

    it('should call countdown with time when startTimer is received', () => {
        const time = 5;
        const countdownSpy = spyOn<any>(component, 'countdown').and.callThrough();
        socketHelper.peerSideEmit(TimeEvents.CurrentTimer, time);
        expect(countdownSpy).toHaveBeenCalledWith(time);
    });

    it('should send start timer event and show countdown', () => {
        const sendSpy = spyOn(mockSocketClientService, 'send');
        const startTimerEvent = {
            initialTime: 5,
            tickRate: 1000,
            roomId: component['roomId'],
        };
        component.startGame();

        expect(sendSpy).toHaveBeenCalledWith(TimeEvents.StartTimer, startTimerEvent);
    });

    it('should set transitionCounter and not redirect if time is not zero', () => {
        const timer = 5;
        component['countdown'](timer);

        expect(component['transitionCounter']).toBe(timer);
        expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should redirect to the game page if time is zero and is player', () => {
        component.isHost = false;
        const gameBeginsRedirectionSpy = spyOn<any>(component, 'gameBeginsRedirection').and.callThrough();
        component['countdown'](0);

        expect(component['transitionCounter']).toBe(0);
        expect(gameBeginsRedirectionSpy).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('game/123/room/456');
    });

    it('should redirect to the host game page if time is zero and is host', () => {
        component.isHost = true;
        const gameBeginsRedirectionSpy = spyOn<any>(component, 'gameBeginsRedirection').and.callThrough();
        component['countdown'](0);

        expect(component['transitionCounter']).toBe(0);
        expect(gameBeginsRedirectionSpy).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('game/123/room/456/host');
    });

    it('should lock the game and set isLocked to true', () => {
        const sendSpy = spyOn(mockSocketClientService, 'send');
        component.lockGame();
        expect(sendSpy).toHaveBeenCalledWith(WaitingEvents.LockRoom, '456');
        expect(component.isLocked).toBeTrue();
    });

    it('should unlock the game and set isLocked to false', () => {
        const sendSpy = spyOn(mockSocketClientService, 'send');
        component.unlockGame();
        expect(sendSpy).toHaveBeenCalledWith(WaitingEvents.UnlockRoom, '456');
        expect(component.isLocked).toBeFalse();
    });

    it('should remove the player by name from the players array', () => {
        component.players = ['Joueur1', 'Joueur2'];
        component['removePlayer']('Joueur1');
        expect(component.players).toEqual(['Joueur2']);
    });

    it('should navigate to the game room as player when not Host', () => {
        component.isHost = false;
        component['gameBeginsRedirection']();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('game/123/room/456');
    });

    it('should send startGame event when Host starts the game', () => {
        spyOn(mockSocketClientService, 'send');
        component.isHost = true;
        component.startGame();
        expect(mockSocketClientService.send).toHaveBeenCalledWith(TimeEvents.StartTimer, { initialTime: 5, tickRate: 1000, roomId: '456' });
    });

    it('should navigate to the host game room and send StartGame event when Host', () => {
        spyOn(mockSocketClientService, 'send');
        component.isHost = true;
        component['gameBeginsRedirection']();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('game/123/room/456/host');
    });

    it('should show the banPopup with the right configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Vous avez été banni de la partie.',
            hasCancelButton: false,
        };

        component['banPopup']();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).toBeDefined();
    });
});
