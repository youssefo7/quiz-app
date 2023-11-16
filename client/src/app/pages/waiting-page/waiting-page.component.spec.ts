// any est nécessaire pour espionner les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { of } from 'rxjs';
import { WaitingPageComponent } from './waiting-page.component';
import SpyObj = jasmine.SpyObj;

@Component({
    selector: 'app-player-list',
})
class PlayerListComponent {}

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;
    let clientSocketServiceMock: jasmine.SpyObj<SocketClientService>;
    let mockRoomCommunicationService: jasmine.SpyObj<RoomCommunicationService>;
    let routerSpy: SpyObj<Router>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['componentInstance']);
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'send', 'socketExists', 'connect', 'disconnect']);
        clientSocketServiceMock.socketExists.and.returnValue(true);
        mockRoomCommunicationService = jasmine.createSpyObj('RoomCommunicationService', ['getRoomPlayers', 'getRoomQuiz']);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [WaitingPageComponent, TopBarComponent, PlayerListComponent],
            providers: [
                { provide: MatDialog, useValue: mockDialog },
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: Router, useValue: routerSpy },
                { provide: SocketClientService, useValue: clientSocketServiceMock },
                { provide: RoomCommunicationService, useValue: mockRoomCommunicationService },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: convertToParamMap({ quizId: '123', roomId: '456' }), url: [] } },
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    }));

    beforeEach(() => {
        mockDialog.open.and.returnValue(mockDialogRef);
        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        mockRoomCommunicationService.getRoomPlayers.and.returnValue(of(['player1', 'player2']));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get the room players on init', async () => {
        await fixture.whenStable();
        expect(mockRoomCommunicationService.getRoomPlayers).toHaveBeenCalledWith('456');
        expect(component['players']).toEqual(['player1', 'player2']);
    });

    it('should listen on event PlayerAbandonedGame and remove player from players list', () => {
        clientSocketServiceMock.on.calls.argsFor(0)[1]('abandonnedPlayer');
        expect(component['players']).not.toContain('abandonnedPlayer');
    });

    it('should send EndGame if the user is the host on beforeUnload', () => {
        component.isHost = true;
        component.beforeUnloadHandler();
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith(GameEvents.EndGame, { roomId: component.roomId, gameAborted: true });
    });

    it('should send PlayerEndGame if the user is a player on beforeUnload', () => {
        component.isHost = false;
        component.beforeUnloadHandler();
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith(GameEvents.PlayerLeaveGame, { roomId: component.roomId, isInGame: true });
    });

    it('should listen to socket events and fetch players if socket exists', fakeAsync(() => {
        const quiz = {} as Quiz;
        clientSocketServiceMock.socketExists.and.returnValue(true);
        const listenToSocketEventsSpy = spyOn<any>(component, 'listenToSocketEvents');
        component.roomId = 'someRoomId';
        mockRoomCommunicationService.getRoomPlayers.and.returnValue(of(component['players']));
        mockRoomCommunicationService.getRoomQuiz.and.returnValue(of(quiz));

        component.ngOnInit();
        tick();

        expect(listenToSocketEventsSpy).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    }));

    it('should connect and handle host or player actions if no socket exists', async () => {
        clientSocketServiceMock.socketExists.and.returnValue(false);
        clientSocketServiceMock.connect.and.callThrough();

        component.isHost = true;
        component.roomId = '1234';
        mockRoomCommunicationService.getRoomPlayers.and.returnValue(of(['testPlayer']));

        await component.ngOnInit();

        if (component.isHost) {
            clientSocketServiceMock.socketExists.and.returnValue(true);
            expect(clientSocketServiceMock.connect).toHaveBeenCalled();
        } else {
            expect(clientSocketServiceMock.connect).toHaveBeenCalled();
            expect(clientSocketServiceMock.send).toHaveBeenCalledWith(GameEvents.PlayerLeaveGame, { roomId: component.roomId, isInGame: true });
            expect(clientSocketServiceMock.disconnect).toHaveBeenCalled();
        }

        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('home/');
    });

    it('should connect and handle host or player actions if no socket exists', async () => {
        clientSocketServiceMock.socketExists.and.returnValue(false);
        clientSocketServiceMock.connect.and.callThrough();

        component.isHost = false;
        component.roomId = '1234';
        mockRoomCommunicationService.getRoomPlayers.and.returnValue(of(['testPlayer']));

        await component.ngOnInit();

        if (component.isHost) {
            expect(clientSocketServiceMock.connect).toHaveBeenCalled();
            clientSocketServiceMock.socketExists.and.returnValue(true);
        }

        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('home/');
    });

    it('should show the hostQuitPopup with the right configuratio when host quits', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir quitter? Tous les joueurs seront exclus de la partie.',
            hasCancelButton: true,
            okButtonText: 'Quitter',
        };
        component.isHost = true;
        component['hostQuitPopup']();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonText).toEqual(mockConfig.okButtonText);
        expect(config.okButtonFunction).toBeDefined();
    });

    it('should open hostQuitPopup when host quits', () => {
        component.isHost = true;
        const hostQuitPopupSpy = spyOn<any>(component, 'hostQuitPopup');
        component.quitPopUp();
        expect(hostQuitPopupSpy).toHaveBeenCalled();
    });

    it('should open playerQuitPopup when player quits', () => {
        component.isHost = false;
        const playerQuitPopupSpy = spyOn<any>(component, 'playerQuitPopup');
        component.quitPopUp();
        expect(playerQuitPopupSpy).toHaveBeenCalled();
    });

    it('should show the playerQuitPopup with the right configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir abandonner la partie?',
            hasCancelButton: true,
        };

        component['playerQuitPopup']();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).toBeDefined();
    });

    it('should show the endGamePopup with the right configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: "L'organisateur a quitté. La partie est terminée.",
            hasCancelButton: false,
        };
        mockDialogRef.componentInstance.config = mockConfig;

        component['gameEndsPopup']();
        expect(mockDialog.open).toHaveBeenCalled();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).toBeDefined();
    });
});
