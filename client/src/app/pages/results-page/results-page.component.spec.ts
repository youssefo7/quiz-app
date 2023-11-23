import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ChatComponent } from '@app/components/chat/chat.component';
import { GamePlayersListComponent } from '@app/components/game-players-list/game-players-list.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { HistoryCommunicationService } from '@app/services/history-communication.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { ResultsPageComponent } from './results-page.component';

describe('ResultsPageComponent', () => {
    let component: ResultsPageComponent;
    let fixture: ComponentFixture<ResultsPageComponent>;
    let clientSocketServiceMock: jasmine.SpyObj<SocketClientService>;
    let roomCommunicationServiceMock: jasmine.SpyObj<RoomCommunicationService>;
    let historyCommunicationServiceMock: jasmine.SpyObj<HistoryCommunicationService>;

    const roomIdMock = '123';

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'socketExists', 'connect', 'disconnect', 'send']);
        clientSocketServiceMock.socketExists.and.returnValue(true);
        roomCommunicationServiceMock = jasmine.createSpyObj('RoomCommunicationService', ['getRoomPlayers']);
        TestBed.configureTestingModule({
            declarations: [ResultsPageComponent, GamePlayersListComponent, MatIcon, TopBarComponent, ChatComponent],
            imports: [FormsModule, RouterTestingModule.withRoutes([{ path: 'home/', component: MainPageComponent }])],
            providers: [
                {
                    provide: SocketClientService,
                    useValue: clientSocketServiceMock,
                },
                { provide: RoomCommunicationService, useValue: roomCommunicationServiceMock },
                { provide: HistoryCommunicationService, useValue: historyCommunicationServiceMock },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '123' }, url: [{ path: 'results' }] } } },
            ],
        });
        fixture = TestBed.createComponent(ResultsPageComponent);
        component = fixture.componentInstance;
        component.roomId = roomIdMock;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call handleNavigation() on beforeUnloadHandler', () => {
        const handleNavigationSpy = spyOn(component, 'handleNavigation');
        component.beforeUnloadHandler();
        expect(handleNavigationSpy).toHaveBeenCalled();
    });

    it('should send EndGame event and disconnect on handleNavigation() if user is host', () => {
        component['isHost'] = true;
        component.handleNavigation();
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith(GameEvents.EndGame, { roomId: roomIdMock, gameAborted: false });
        expect(clientSocketServiceMock.disconnect).toHaveBeenCalled();
    });

    it('should send PlayerLeaveGame event and disconnect on handleNavigation() if user is not host', () => {
        component['isHost'] = false;
        component.handleNavigation();
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith(GameEvents.PlayerLeaveGame, { roomId: roomIdMock, isInGame: false });
        expect(clientSocketServiceMock.disconnect).toHaveBeenCalled();
    });

    it('should connect user and send EndGame event if user is host and then disconnect', async () => {
        let socketExists = false;
        clientSocketServiceMock.socketExists.and.callFake(() => socketExists);
        clientSocketServiceMock.connect.and.callFake(() => {
            socketExists = true;
        });

        component['isHost'] = true;
        await component.ngOnInit();

        expect(clientSocketServiceMock.connect).toHaveBeenCalled();
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith(GameEvents.EndGame, { roomId: roomIdMock, gameAborted: false });
        expect(clientSocketServiceMock.disconnect).toHaveBeenCalled();
    });

    it('should connect user and send PlayerLeaveGame event if user is not host and then disconnect', async () => {
        let socketExists = false;
        clientSocketServiceMock.socketExists.and.callFake(() => socketExists);
        clientSocketServiceMock.connect.and.callFake(() => {
            socketExists = true;
        });

        component['isHost'] = false;
        await component.ngOnInit();

        expect(clientSocketServiceMock.connect).toHaveBeenCalled();
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith(GameEvents.PlayerLeaveGame, { roomId: roomIdMock, isInGame: false });
        expect(clientSocketServiceMock.disconnect).toHaveBeenCalled();
    });
});
