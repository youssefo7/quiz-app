import { Room } from '@app/interfaces/room';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatEvents } from './chat.gateway.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class ChatGateway {
    @WebSocketServer() private server: Server;
    private rooms: Room[];

    constructor(
        private readonly logger: Logger,
        private roomManager: RoomManagerService,
    ) {
        this.rooms = roomManager.rooms as Room[];
    }

    @SubscribeMessage(ChatEvents.RoomMessage)
    handleRoomMessage(socket: Socket, data: { roomId: string; message: string }) {
        const room = this.roomManager.findRoom(data.roomId);
        const user = this.roomManager.findUser(socket.id, room);
        const time = new Date();
        const timeString = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
        if (socket.rooms.has(data.roomId)) {
            socket.to(data.roomId).emit(ChatEvents.NewRoomMessage, { name: user.name, timeString, message: data.message, sentByUser: false });
            socket.emit(ChatEvents.SentByYou, { name: user.name, timeString, message: data.message, sentByYou: true });
        }
    }
}
