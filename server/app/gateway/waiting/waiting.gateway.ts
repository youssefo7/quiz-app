import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WaitingEvents } from './waiting.gateway.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class WaitingGateway {
    @WebSocketServer() private server: Server;

    constructor(private roomManager: RoomManagerService) {}

    @SubscribeMessage(WaitingEvents.ToggleLockRoom)
    handleToggleLockRoom(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        room.isLocked = !room.isLocked;
    }

    @SubscribeMessage(WaitingEvents.GetPlayerNames)
    handleGetPlayerNames(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        const playerNames = room.players.map((player) => player.name);
        return playerNames;
    }

    @SubscribeMessage(WaitingEvents.BanName)
    handleBanName(_: Socket, data: { roomId: string; name: string }) {
        const room = this.roomManager.findRoom(data.roomId);
        this.roomManager.addBannedNameToRoom(room, data.name);
        const player = this.roomManager.findPlayerByName(room, data.name);

        if (player) {
            this.roomManager.removePlayer(room, player.socketId);
            const playerSocket = this.server.sockets.sockets.get(player.socketId);
            if (playerSocket) {
                playerSocket.emit('banNotification');
                playerSocket.leave(data.roomId);
                playerSocket.disconnect();
            }
            this.server.emit(WaitingEvents.BanName, data.name);
        }
    }
}