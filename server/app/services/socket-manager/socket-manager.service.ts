import { Injectable } from '@nestjs/common';
import * as http from 'http';
import * as io from 'socket.io';

@Injectable()
export class SocketManagerService {
    private sio: io.Server;
    private room: string;

    constructor(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ["GET", "POST"] } });
        this.room = "serverRoom";
    }

    public handleSockets(): void {
        this.sio.on('connection', (socket) => {
            console.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
            socket.emit("hello", "hello World");

            socket.on('joinRoom', () => {
                socket.join(this.room);
            });

            socket.on('roomMessage', (message: string) => {
                if (socket.rooms.has(this.room)) {
                    this.sio.to(this.room).emit("roomMessage",`${socket.id} : ${message}`);
                }
            });

            socket.on('disconnect', (reason) => {
                console.log(`Deconnexion par l'utilisateur avec id : ${socket.id}`);
                console.log(`Raison de deconnexion : ${reason}`)
            });
        });
    }
}
