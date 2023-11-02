import { Room } from '@app/interfaces/room';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JoinEvents } from './join.gateway.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class JoinGateway {
    @WebSocketServer() private server: Server;
    private rooms: Room[];

    constructor(private roomManager: RoomManagerService) {
        this.rooms = roomManager.rooms;
    }

    @SubscribeMessage(JoinEvents.JoinRoom)
    handleJoinRoom(socket: Socket, roomId: string) {
        socket.join(roomId);
    }

    @SubscribeMessage(JoinEvents.SuccessfulJoin)
    handleSuccessfulJoin(_: Socket, data: { roomId: string; name: string }) {
        const room = this.roomManager.findRoom(data.roomId);
        this.server.to(room.id).emit(JoinEvents.PlayerHasJoined, data.name);
    }
}
