import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class ChatGateway {
    @WebSocketServer() private server: Server;

    constructor(private roomManager: RoomManagerService) {}

    @SubscribeMessage('roomMessage')
    handleRoomMessage(socket: Socket, data: { roomId: string; message: string }) {
        const user = this.roomManager.findUser(socket.id);
        const time = new Date();

        const timeString = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
        this.server.to(data.roomId).emit('roomMessage', `${user.name} (${timeString}) : ${data.message}`);
    }
}
