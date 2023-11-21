import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { ChatMessage } from '@common/chat-message';
import { ChatEvents } from '@common/chat.events';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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
        const newChatMessage: ChatMessage = {
            authorName: user.name,
            time: timeString,
            message: data.message,
            fromSystem: false,
        };

        if (socket.rooms.has(data.roomId)) {
            this.server.to(data.roomId).emit(ChatEvents.NewRoomMessage, newChatMessage);
        }
    }

    @SubscribeMessage(ChatEvents.ToggleChattingRights)
    handleToggleChattingRights(_: Socket, data: { roomId: string; playerName: string }) {
        const room = this.roomManager.findRoom(data.roomId);
        const player = this.roomManager.findPlayerByName(room, data.playerName);
        player.canChat = !player.canChat;
        this.server.to(player.socketId).emit(ChatEvents.ToggleChattingRights, player.canChat);
    }
}
