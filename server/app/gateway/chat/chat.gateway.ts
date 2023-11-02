import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatEvents } from './chat.gateway.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class ChatGateway {
    @WebSocketServer() private server: Server;

    constructor(private roomManager: RoomManagerService) {}

    @SubscribeMessage(ChatEvents.RoomMessage)
    handleRoomMessage(socket: Socket, data: { roomId: string; message: string }) {
        const room = this.roomManager.findRoom(data.roomId);
        const user = this.roomManager.findUser(socket.id, room);
        const time = new Date();
        const timeString = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
        let messageData = { name: user.name, timeString, message: data.message, sentByUser: false };

        socket.to(data.roomId).emit('newRoomMessage', messageData);
        socket.emit('sentByYou', (messageData = { ...messageData, sentByUser: true }));
    }
}
