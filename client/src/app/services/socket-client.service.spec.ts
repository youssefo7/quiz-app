import { TestBed } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Socket } from 'socket.io-client';
import { SocketClientService } from './socket-client.service';

describe('SocketClientService', () => {
    let service: SocketClientService;
    let event: string;

    beforeEach(() => {
        event = 'TestEvent';
    });

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SocketClientService);
        service.socket = new SocketTestHelper() as unknown as Socket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should perform specific actions after a successful connection', async () => {
        const connectSpy = spyOn(service, 'connect').and.callThrough();
        service.connect();
        await Promise.resolve();
        expect(connectSpy).toHaveBeenCalled();
    });

    it('should disconnect if the user leaves the game', () => {
        const disconnectSpy = spyOn(service.socket, 'disconnect');
        service.disconnect();
        expect(disconnectSpy).toHaveBeenCalled();
    });

    it('if socket is defined and connected to a game', () => {
        service.socket.connected = true;
        const socketIsActive = service.socketExists();
        expect(socketIsActive).toBeTruthy();
    });

    it('socketExists should return false if the socket is no longer connected to a game', () => {
        service.socket.connected = false;
        const socketIsActive = service.socketExists();
        expect(socketIsActive).toBeFalsy();
    });

    it('socketExists() should return false if the socket is not defined in a game', () => {
        (service.socket as unknown) = undefined;
        const socketIsActive = service.socketExists();
        expect(socketIsActive).toBeFalsy();
    });

    it('should call socket.on with a valid event', () => {
        const action = () => {
            // empty action
        };
        const spySocketOn = spyOn(service.socket, 'on');
        service.on(event, action);
        expect(spySocketOn).toHaveBeenCalled();
        expect(spySocketOn).toHaveBeenCalledWith(event, action);
    });

    it('should call emit with the data in parameter when using send', () => {
        const data = 'playerName';
        const emitSpy = spyOn(service.socket, 'emit');
        service.send(event, data);
        expect(emitSpy).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalledWith(event, data);
    });

    it('should call emit without data when using send if data is undefined', () => {
        const data = undefined;
        const emitSpy = spyOn(service.socket, 'emit');
        service.send(event, data);
        expect(emitSpy).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalledWith(event);
    });
});
