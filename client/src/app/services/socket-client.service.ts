import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketClientService {
  socket: Socket;

  doesSocketExist() {
      return this.socket && this.socket.connected;
  }

  connect() {
    this.socket = io(environment.serverUrl, { transports: ['websocket'], upgrade: false }); 
  }

  disconnect() {
    this.socket.disconnect();
  }

  on<T>(event: string, action: (data: T) => void): void {
    this.socket.on(event, action);
  }
}
