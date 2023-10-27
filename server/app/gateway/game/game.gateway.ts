import { Player } from '@app/interfaces/room';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameEvents } from './game.gateway.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class GameGateway {
    @WebSocketServer() private server: Server;

    constructor(private roomManager: RoomManagerService) {}

    @SubscribeMessage(GameEvents.StartGame)
    handleStartGame(_: Socket, roomId: string) {
        this.server.to(roomId).emit(GameEvents.StartGame);
    }

    // TODO : il faut déconnecter la personne qui a abandonné! (frontend ?)
    @SubscribeMessage(GameEvents.PlayerLeaveGame)
    handlePlayerLeaveGame(socket: Socket, data: { roomId: string; hasGameStarted: boolean }) {
        const user = this.roomManager.findUser(socket.id);
        const room = this.roomManager.findRoom(data.roomId);

        const isPlayer = user.name !== room.organizer.name;

        if (data.hasGameStarted && isPlayer) {
            (user as Player).hasAbandoned = true;
            this.server.to(room.organizer.socketId).emit('abandonedGame', user.name);
        }
        this.roomManager.removeUser(room, user.socketId);
        socket.leave(room.id);
        socket.disconnect();
    }

    // TODO : faire le disconnect ici aussi
    @SubscribeMessage(GameEvents.EndGame)
    async handleEndGame(socket: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        const sockets = await this.server.sockets.fetchSockets();

        socket.to(room.id).emit(GameEvents.EndGame);
        sockets.forEach((playerSocket) => {
            playerSocket.leave(room.id);
            playerSocket.disconnect();
        });
        this.roomManager.deleteRoom(room);
    }

    @SubscribeMessage(GameEvents.GoodAnswer)
    handleGoodAnswer(socket: Socket, data: { roomId: string; timeStamp: Date }) {
        const room = this.roomManager.findRoom(data.roomId);
        room.answerTimes.push({ userId: socket.id, timeStamp: data.timeStamp.getTime() });
    }

    @SubscribeMessage(GameEvents.QuestionChoiceSelect)
    handleQuestionChoiceSelect(_: Socket, data: { roomId: string; questionChoiceIndex: number }) {
        const organizer = this.roomManager.findRoom(data.roomId).organizer.socketId;
        this.server.to(organizer).emit('addQuestionChoice', data.questionChoiceIndex);
    }

    @SubscribeMessage(GameEvents.QuestionChoiceUnselect)
    handleQuestionChoiceUnselect(_: Socket, data: { roomId: string; questionChoiceIndex: number }) {
        const organizer = this.roomManager.findRoom(data.roomId).organizer.socketId;
        this.server.to(organizer).emit('removeQuestionChoice', data.questionChoiceIndex);
    }

    @SubscribeMessage(GameEvents.GiveBonus)
    handleGiveBonus(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        const quickestPlayer = this.roomManager.getQuickestTime(room);
        if (quickestPlayer) {
            const player = this.roomManager.findUser(quickestPlayer.userId) as Player;
            player.bonusCount++;
            this.server.to(quickestPlayer.userId).emit('bonus');
        }
    }

    // C'est le joueur qui doit envoyer cet événement pour que ses points soient mis à jour
    @SubscribeMessage(GameEvents.AddPointsToPlayer)
    handleAddPointsToPlayer(socket: Socket, data: { roomId: string; points: number }) {
        const room = this.roomManager.findRoom(data.roomId);
        this.roomManager.addPointsToPlayer(socket.id, data.points);
        const player = this.roomManager.findUser(socket.id) as Player;
        this.server.to(room.organizer.socketId).emit(GameEvents.AddPointsToPlayer, { pointsToAdd: data.points, name: player.name });
    }

    @SubscribeMessage(GameEvents.NextQuestion)
    handleNextQuestion(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        this.roomManager.resetTimes(room);
        this.server.to(roomId).emit(GameEvents.NextQuestion);
    }

    @SubscribeMessage(GameEvents.RoomData)
    handleRoomData(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        return room;
    }
}
