import { Player, Room } from '@app/interfaces/room';
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

    @SubscribeMessage(JoinEvents.CreateRoom)
    handleCreateRoom(socket: Socket, quizId: string) {
        const roomId = this.roomManager.createNewRoom(quizId, socket.id);
        return roomId;
    }

    @SubscribeMessage(JoinEvents.JoinRoom)
    handleJoinRoom(socket: Socket, roomId: string) {
        const roomExists = this.roomManager.findRoom(roomId);
        if (roomExists) {
            if (!roomExists.isLocked) {
                this.roomManager.addPlayerToRoom(roomExists, socket.id);
                socket.join(roomId);
                return { roomState: 'OK', quizId: roomExists.quizId };
            } else {
                return { roomState: 'IS_LOCKED', quizId: null };
            }
        } else {
            return { roomState: 'INVALID', quizId: null };
        }
    }

    @SubscribeMessage(JoinEvents.ChooseName)
    handleChooseName(socket: Socket, name: string) {
        let wantedPlayer: Player;
        const playerRoom = this.rooms.find((room) => {
            wantedPlayer = room.players.find((player) => player.socketId === socket.id);
            return wantedPlayer ? true : false;
        });

        const nameExists = this.roomManager.isNameTaken(playerRoom, name);
        const isBannedName = this.roomManager.isBannedName(playerRoom, name);
        const isNameValid = !nameExists && !isBannedName;

        if (isNameValid) {
            wantedPlayer.name = name;
        }

        return isNameValid;
    }

    @SubscribeMessage(JoinEvents.SuccessfulJoin)
    handleSuccessfulJoin(_: Socket, data: { roomId: string; name: string }) {
        const room = this.roomManager.findRoom(data.roomId);
        this.server.to(room.id).emit('playerHasJoined', data.name);
    }
}
