import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JoinEvents } from './join.gateway.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class JoinGateway {
    @WebSocketServer() private server: Server;

    @SubscribeMessage(JoinEvents.JoinRoom)
    handleJoinRoom(socket: Socket, roomId: string) {
        socket.join(roomId);
    }

    @SubscribeMessage(JoinEvents.SuccessfulJoin)
    handleSuccessfulJoin(_: Socket, data: { roomId: string; name: string }) {
        this.server.to(data.roomId).emit(JoinEvents.PlayerHasJoined, data.name);
    }
}
