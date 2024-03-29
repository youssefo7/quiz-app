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
        this.socket.disconnect();
    }

    on<T>(event: string, action: (data: T) => void) {
        this.socket.on(event, action);
    }

    // On ne sait pas le type de la fonction préalablement à son appel
    // eslint-disable-next-line @typescript-eslint/ban-types
    send<T>(event: string, data?: T, callback?: Function) {
        this.socket.emit(event, ...[data, callback].filter((x) => x));
    }
}
