import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketClientService {
    socket: Socket;

    socketExists() {
        return this.socket && this.socket.connected;
    }

    connect() {
        this.socket = io(environment.socketUrl, { transports: ['websocket'], upgrade: false });
    }

    disconnect() {
        // TODO : Check if the connections have to be managed when closing tabs for players and organizers
        this.socket.disconnect();
    }

    on<T>(event: string, action: (data: T) => void): void {
        this.socket.on(event, action);
    }

    // We don't know the type of the function before its been called
    // eslint-disable-next-line @typescript-eslint/ban-types
    send<T>(event: string, data?: T, callback?: Function): void {
        this.socket.emit(event, ...[data, callback].filter((x) => x));
    }
}
