import { Room } from '@app/interfaces/room';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WaitingEvents } from './waiting.gateway.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class WaitingGateway {
    @WebSocketServer() private server: Server;
    private rooms: Room[];

    constructor(
        private readonly logger: Logger,
        private roomManager: RoomManagerService,
    ) {
        this.rooms = roomManager.rooms;
    }

    @SubscribeMessage(WaitingEvents.ToggleLockRoom)
    handleToggleLockRoom(socket: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        room.isLocked = !room.isLocked;
    }

    @SubscribeMessage(WaitingEvents.GetPlayerNames)
    handleGetPlayerNames(socket: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        const playerNames = room.players.map((player) => player.name);
        return playerNames;
    }

    @SubscribeMessage(WaitingEvents.BanName)
    handleBanName(socket: Socket, data: { roomId: string; name: string }) {
        const room = this.roomManager.findRoom(data.roomId);
        this.roomManager.addBannedNameToRoom(room, data.name);
        const player = this.roomManager.findPlayerByName(room, data.name);
        this.roomManager.removeUser(room, player.socketId);
        this.server.emit(WaitingEvents.BanName, data.name);
    }
}
