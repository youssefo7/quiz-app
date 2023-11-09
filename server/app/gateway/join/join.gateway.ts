import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { JoinEvents } from '@common/join.events';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class JoinGateway {
    @WebSocketServer() private server: Server;

    constructor(private roomManagerService: RoomManagerService) {}

    @SubscribeMessage(JoinEvents.JoinRoom)
    handleJoinRoom(socket: Socket, data: { roomId: string; name: string }) {
        socket.join(data.roomId);
        const room = this.roomManagerService.findRoom(data.roomId);
        this.roomManagerService.addPlayerToRoom(room, socket.id, data.name);
    }

    @SubscribeMessage(JoinEvents.SuccessfulJoin)
    handleSuccessfulJoin(_: Socket, data: { roomId: string; name: string }) {
        this.server.to(data.roomId).emit(JoinEvents.PlayerHasJoined, data.name);
    }

    @SubscribeMessage(JoinEvents.OrganizerJoined)
    handleOrganizerJoinRoom(socket: Socket, roomId: string) {
        socket.join(roomId);
    }
}
