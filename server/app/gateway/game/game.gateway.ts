import { Player, Room } from '@app/interfaces/room';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameEvents } from './game.gateway.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class GameGateway {
    @WebSocketServer() private server: Server;
    private rooms: Room[];

    constructor(
        private readonly logger: Logger,
        private roomManager: RoomManagerService,
    ) {
        this.rooms = roomManager.rooms;
    }

    @SubscribeMessage(GameEvents.StartGame)
    handleStartGame(socket: Socket, roomId: string) {
        this.server.to(roomId).emit(GameEvents.StartGame);
    }

    @SubscribeMessage(GameEvents.PlayerLeaveGame)
    handlePlayerLeaveGame(socket: Socket, data: { roomId: string; hasGameStarted: boolean }) {
        const user = this.roomManager.findUser(socket.id);
        const room = this.roomManager.findRoom(data.roomId);

        const isPlayer = user.name !== room.organizer.name;

        if (data.hasGameStarted && isPlayer) {
            (user as Player).hasAbandoned = true;
            this.server.to(room.organizer.socketId).emit('AbandonedGame', user.name);
        }
        this.roomManager.removeUser(room, user.socketId);
        socket.leave(room.id);
    }

    @SubscribeMessage(GameEvents.EndGame)
    async handleEndGame(socket: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        const sockets = await this.server.sockets.fetchSockets();

        socket.to(room.id).emit('gameEnded');
        sockets.forEach((playerSocket) => playerSocket.leave(room.id));
        this.roomManager.deleteRoom(room);
    }

    @SubscribeMessage(GameEvents.GoodAnswer)
    handleGoodAnswer(socket: Socket, data: { roomId: string; timeStamp: Date }) {
        const room = this.roomManager.findRoom(data.roomId);
        room.answerTimes.push({ userId: socket.id, timeStamp: data.timeStamp.getTime() });
    }

    @SubscribeMessage(GameEvents.QuestionChoiceSelect)
    handleQuestionChoiceSelect(socket: Socket, data: { roomId: string; questionChoiceIndex: number }) {
        const organizer = this.roomManager.findRoom(data.roomId).organizer.socketId;
        this.server.to(organizer).emit('addQuestionChoice', data.questionChoiceIndex);
    }

    @SubscribeMessage(GameEvents.QuestionChoiceUnselect)
    handleQuestionChoiceUnselect(socket: Socket, data: { roomId: string; questionChoiceIndex: number }) {
        const organizer = this.roomManager.findRoom(data.roomId).organizer.socketId;
        this.server.to(organizer).emit('removeQuestionChoice', data.questionChoiceIndex);
    }

    @SubscribeMessage(GameEvents.GiveBonus)
    handleGiveBonus(socket: Socket, roomId: string) {
        const quickestPlayer = this.roomManager.getQuickestTime(this.roomManager.findRoom(roomId));
        const room = this.roomManager.findRoom(roomId);
        if (quickestPlayer) {
            room.bonusCount++;
            this.server.to(quickestPlayer.userId).emit('bonus');
        }
    }

    @SubscribeMessage(GameEvents.AddPointsToPlayer)
    handleAddPointsToPlayer(socket: Socket, data: { roomId: string; points: number; name: string }) {
        const room = this.roomManager.findRoom(data.roomId);
        this.roomManager.addPointsToPlayer(data.roomId, data.name, data.points);
        const player = this.roomManager.findPlayerByName(room, data.name);
        this.server.to(room.organizer.socketId).emit(GameEvents.AddPointsToPlayer, player.points);
    }

    @SubscribeMessage(GameEvents.NextQuestion)
    handleNextQuestion(socket: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        this.roomManager.resetTimes(room);
        socket.to(roomId).emit(GameEvents.NextQuestion);
    }

    @SubscribeMessage(GameEvents.RoomData)
    handleRoomData(socket: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        return room;
    }
}
