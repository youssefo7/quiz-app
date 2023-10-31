import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { GameEvents } from '@app/events/game.events';
import { JoinEvents } from '@app/events/join.events';
import { WaitingEvents } from '@app/events/waiting.events';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { SocketClientService } from '@app/services/socket-client.service';
import { Socket } from 'socket.io-client';
import { PlayerListComponent } from './player-list.component';

import SpyObj = jasmine.SpyObj;

class MockSocketClientService extends SocketClientService {
    // On a disable ce qui est lié au fichier socket-test-helper puisque le code est fournit (approuvé par professeur)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    override connect() {}
}

describe('PlayerListComponent', () => {
    let component: PlayerListComponent;
    let fixture: ComponentFixture<PlayerListComponent>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;
    let mockSocketClientService: MockSocketClientService;
    let routerSpy: SpyObj<Router>;
    let socketHelper: SocketTestHelper;
    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('mockDialogRef', ['componentInstance']);
    });

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        mockSocketClientService = new MockSocketClientService();
        mockSocketClientService.socket = socketHelper as unknown as Socket;

        await TestBed.configureTestingModule({
            declarations: [PlayerListComponent],
            providers: [
                { provide: MatDialog, useValue: mockDialog },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: convertToParamMap({ quizId: '123', roomId: '456' }), url: [] } },
                },
                { provide: SocketClientService, useValue: mockSocketClientService },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        mockDialog.open.and.returnValue(mockDialogRef);
        fixture = TestBed.createComponent(PlayerListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        mockSocketClientService = TestBed.inject(SocketClientService) as unknown as MockSocketClientService;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call connect when component is initialized', () => {
        spyOn(mockSocketClientService, 'connect');
        component.ngOnInit();
        expect(mockSocketClientService.connect).toHaveBeenCalled();
    });

    it('should add player when PlayerHasJoined event is received', () => {
        const playerTest = 'playerTest';
        socketHelper.peerSideEmit(JoinEvents.PlayerHasJoined, playerTest);
        expect(component.players).toContain('playerTest');
    });

    it('should bann player when BanName event is received', () => {
        const playerTest = 'BannedPlayer';
        const removePlayerMock = spyOn(component, 'removePlayer').and.callThrough();

        socketHelper.peerSideEmit(WaitingEvents.BanName, playerTest);
        expect(component.bannedPlayers).toContain('BannedPlayer');
        expect(removePlayerMock).toHaveBeenCalledWith('BannedPlayer');
        expect(component.players).not.toContain('BannedPlayer');
    });

    it('should remove player when PlayerAbandonedGame event is received', () => {
        const playerTest = 'AbandonedPlayer';
        const removePlayerMock = spyOn(component, 'removePlayer').and.callThrough();

        socketHelper.peerSideEmit(GameEvents.PlayerAbandonedGame, playerTest);
        expect(removePlayerMock).toHaveBeenCalledWith('AbandonedPlayer');
        expect(component.players).not.toContain('AbandonedPlayer');
    });

    it('should start game when StartGame event is received', () => {
        const startGameMock = spyOn(component, 'startGame').and.callThrough();
        socketHelper.peerSideEmit(GameEvents.StartGame);
        expect(startGameMock).toHaveBeenCalled();
    });

    it('should end game when EndGame event is received', () => {
        const endGameMock = spyOn(component, 'gameEndPopup');
        socketHelper.peerSideEmit(GameEvents.GameAborted);
        expect(endGameMock).toHaveBeenCalled();
    });

    it('should lock the game and set isLocked to true', () => {
        spyOn(mockSocketClientService, 'send');
        component.lockGame();
        expect(mockSocketClientService.send).toHaveBeenCalledWith(WaitingEvents.LockRoom);
        expect(component.isLocked).toBeTrue();
    });

    it('should unlock the game and set isLocked to false', () => {
        spyOn(mockSocketClientService, 'send');
        component.unlockGame();
        expect(mockSocketClientService.send).toHaveBeenCalledWith(WaitingEvents.UnlockRoom);
        expect(component.isLocked).toBeFalse();
    });

    it('should remove the player by name from the players array', () => {
        component.players = ['Joueur1', 'Joueur2'];
        component.removePlayer('Joueur1');
        expect(component.players).toEqual(['Joueur2']);
    });

    it('should navigate to the game room as player when not Host', () => {
        component.isHost = false;
        component.startGame();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['game/', '123', 'room/', '456']);
    });

    it('should navigate to the host game room and send StartGame event when Host', () => {
        spyOn(mockSocketClientService, 'send');
        component.isHost = true;
        component.startGame();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['game/', '123', 'room/', '456', 'host/']);
        expect(mockSocketClientService.send).toHaveBeenCalledWith(GameEvents.StartGame);
    });

    it('should call host popUp if Host quits', () => {
        const hostQuitPopupSpy = spyOn(component, 'hostQuitPopup');
        component.isHost = true;
        component.quitPopUp();
        expect(hostQuitPopupSpy).toHaveBeenCalled();
    });

    it('should call player popUp if player quits', () => {
        const playerQuitPopupSpy = spyOn(component, 'playerQuitPopup');
        component.isHost = false;
        component.quitPopUp();
        expect(playerQuitPopupSpy).toHaveBeenCalled();
    });

    it('should call game end popUp if Host quits', () => {
        const hostQuitPopupSpy = spyOn(component, 'gameEndPopup');
        component.isHost = true;
        component.gameEndPopup();
        expect(hostQuitPopupSpy).toHaveBeenCalled();
    });

    it('should show the host quit popup with the right configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Êtes-vous sur de vouloir quitter? Tous les joueurs seront exclus de la partie.',
            hasCancelButton: true,
        };

        component.hostQuitPopup();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).toBeDefined();
    });

    it('should show the player quit popup with the right configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Êtes-vous sur de vouloir abandonner la partie?',
            hasCancelButton: true,
        };

        component.playerQuitPopup();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).toBeDefined();
    });

    it('should show the end game popup with the right configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: "L'organisateur a quitté. La partie est terminée.",
            hasCancelButton: false,
        };

        component.gameEndPopup();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).toBeDefined();
    });
});
