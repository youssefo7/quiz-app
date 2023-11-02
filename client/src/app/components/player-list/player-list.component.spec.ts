import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
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
    let routerSpy: SpyObj<Router>;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['componentInstance']);
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

    it('should call listenToSocketEvents and send GetPlayerNames when component is initialized', () => {
        const listenSpy = spyOn(component, 'listenToSocketEvents');
        spyOn(mockSocketClientService, 'send');
        component.ngOnInit();
        expect(listenSpy).toHaveBeenCalled();
        // TODO: tester la modification de la liste de joueurs
    });

    it('should add player when PlayerHasJoined event is received', () => {
        socketHelper.peerSideEmit(JoinEvents.PlayerHasJoined, 'playerName');
        expect(component.players).toContain('playerName');
    });

    it('should ban player when BanName event is received', () => {
        const removePlayerSpy = spyOn(component, 'removePlayer').and.callThrough();

        socketHelper.peerSideEmit(WaitingEvents.BanName, 'playerToBan');
        expect(component.bannedPlayers).toContain('playerToBan');
        expect(removePlayerSpy).toHaveBeenCalledWith('playerToBan');
        expect(component.players).not.toContain('playerToBan');
    });

    it('should remove player when PlayerAbandonedGame event is received', () => {
        const removePlayerSpy = spyOn(component, 'removePlayer').and.callThrough();

        socketHelper.peerSideEmit(GameEvents.PlayerAbandonedGame, 'AbandonedPlayer');
        expect(removePlayerSpy).toHaveBeenCalledWith('AbandonedPlayer');
        expect(component.players).not.toContain('AbandonedPlayer');
    });

    it('should redirect users when StartGame event is received', () => {
        const redirectUsersSpy = spyOn(component, 'gameBeginsRedirection');
        socketHelper.peerSideEmit(GameEvents.StartGame);
        expect(redirectUsersSpy).toHaveBeenCalled();
    });

    it('should end game when EndGame event is received', () => {
        const endGameSpy = spyOn(component, 'gameEndPopup');
        socketHelper.peerSideEmit(GameEvents.GameAborted);
        expect(endGameSpy).toHaveBeenCalled();
    });

    it('should lock the game and set isLocked to true', () => {
        spyOn(mockSocketClientService, 'send');
        component.lockGame();
        expect(mockSocketClientService.send).toHaveBeenCalledWith(WaitingEvents.LockRoom, '456');
        expect(component.isLocked).toBeTrue();
    });

    it('should unlock the game and set isLocked to false', () => {
        spyOn(mockSocketClientService, 'send');
        component.unlockGame();
        expect(mockSocketClientService.send).toHaveBeenCalledWith(WaitingEvents.UnlockRoom, '456');
        expect(component.isLocked).toBeFalse();
    });

    it('should remove the player by name from the players array', () => {
        component.players = ['Joueur1', 'Joueur2'];
        component.removePlayer('Joueur1');
        expect(component.players).toEqual(['Joueur2']);
    });

    it('should navigate to the game room as player when not Host', () => {
        component.isHost = false;
        component.gameBeginsRedirection();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('game/123/room/456');
    });

    it('should send startGame event when Host starts the game', () => {
        spyOn(mockSocketClientService, 'send');
        component.isHost = true;
        component.startGame();
        expect(mockSocketClientService.send).toHaveBeenCalledWith(GameEvents.StartGame, '456');
    });

    it('should navigate to the host game room and send StartGame event when Host', () => {
        spyOn(mockSocketClientService, 'send');
        component.isHost = true;
        component.gameBeginsRedirection();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('game/123/room/456/host');
    });

    it('should call hostPopup if Host quits', () => {
        const hostQuitPopupSpy = spyOn(component, 'hostQuitPopup');
        component.isHost = true;
        component.quitPopUp();
        expect(hostQuitPopupSpy).toHaveBeenCalled();
    });

    it('should call playerPopup if player quits', () => {
        const playerQuitPopupSpy = spyOn(component, 'playerQuitPopup');
        component.isHost = false;
        component.quitPopUp();
        expect(playerQuitPopupSpy).toHaveBeenCalled();
    });

    it('should call game endPopup if Host quits', () => {
        const hostQuitPopupSpy = spyOn(component, 'gameEndPopup');
        socketHelper.peerSideEmit(GameEvents.GameAborted);
        expect(hostQuitPopupSpy).toHaveBeenCalled();
    });

    it('should show the hostQuitPopup with the right configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir quitter? Tous les joueurs seront exclus de la partie.',
            hasCancelButton: true,
        };

        component.hostQuitPopup();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).toBeDefined();
    });

    it('should show the playerQuitPopup with the right configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir abandonner la partie?',
            hasCancelButton: true,
        };

        component.playerQuitPopup();
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

        component.gameEndPopup();
        const config = mockDialogRef.componentInstance.config;

        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonFunction).toBeDefined();
    });
});
