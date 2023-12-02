import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GameEvents } from '@common/game.events';
import { SocketClientService } from './socket-client.service';
import { SocketDisconnectionService } from './socket-disconnection.service';

describe('SocketDisconnectionService', () => {
    let service: SocketDisconnectionService;
    let socketClientServiceMock: jasmine.SpyObj<SocketClientService>;
    let routerMock: jasmine.SpyObj<Router>;

    beforeEach(() => {
        socketClientServiceMock = jasmine.createSpyObj('SocketClientService', ['socketExists', 'connect', 'send', 'disconnect']);
        socketClientServiceMock.socketExists.and.returnValue(true);
        routerMock = jasmine.createSpyObj('Router', ['navigateByUrl']);

        TestBed.configureTestingModule({
            providers: [
                SocketDisconnectionService,
                { provide: SocketClientService, useValue: socketClientServiceMock },
                { provide: Router, useValue: routerMock },
            ],
        });

        service = TestBed.inject(SocketDisconnectionService);

        socketClientServiceMock.send.and.callFake((event, data, callback) => {
            if (callback) {
                callback();
            }
        });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('handleDisconnectEvent', () => {
        it('should connect if socket does not exist and it is not a test game', () => {
            socketClientServiceMock.socketExists.and.returnValue(false);
            const options = { roomId: '123', isTestGame: false };
            service.handleDisconnectEvent(options);
            expect(socketClientServiceMock.connect).toHaveBeenCalled();
        });

        it('should not connect if it is a test game', () => {
            socketClientServiceMock.socketExists.and.returnValue(false);
            const options = { roomId: '123', isTestGame: true };
            service.handleDisconnectEvent(options);
            expect(socketClientServiceMock.connect).not.toHaveBeenCalled();
        });

        it('should handle socket connections, events and navigation correctly if user is a player', async () => {
            let socketExists = false;
            socketClientServiceMock.socketExists.and.callFake(() => socketExists);
            socketClientServiceMock.connect.and.callFake(() => {
                socketExists = true;
            });

            const options = { roomId: '123', isHost: false, isInGame: true };
            service.handleDisconnectEvent(options);

            expect(socketClientServiceMock.connect).toHaveBeenCalled();
            expect(socketClientServiceMock.send).toHaveBeenCalledWith(
                GameEvents.PlayerLeaveGame,
                { roomId: '123', isInGame: true },
                jasmine.any(Function),
            );
            expect(socketClientServiceMock.disconnect).toHaveBeenCalled();
            expect(routerMock.navigateByUrl).toHaveBeenCalledWith('home/');
        });

        it('should handle socket connections, events and navigation correctly if user is a host', async () => {
            let socketExists = false;
            socketClientServiceMock.socketExists.and.callFake(() => socketExists);
            socketClientServiceMock.connect.and.callFake(() => {
                socketExists = true;
            });

            const options = { roomId: '123', isHost: true, gameAborted: true };
            service.handleDisconnectEvent(options);

            expect(socketClientServiceMock.connect).toHaveBeenCalled();
            expect(socketClientServiceMock.send).toHaveBeenCalledWith(
                GameEvents.EndGame,
                { roomId: '123', gameAborted: true },
                jasmine.any(Function),
            );
            expect(socketClientServiceMock.disconnect).toHaveBeenCalled();
            expect(routerMock.navigateByUrl).toHaveBeenCalledWith('home/');
        });

        it('should call connectActions if provided and socket exists', () => {
            const connectActionsSpy = jasmine.createSpy('connectActions');
            socketClientServiceMock.socketExists.and.returnValue(true);
            const options = { roomId: '123', connectActions: connectActionsSpy };
            service.handleDisconnectEvent(options);
            expect(connectActionsSpy).toHaveBeenCalled();
        });
    });
});
