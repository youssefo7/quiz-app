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

    @SubscribeMessage(GameEvents.PlayerLeaveGame)
    handlePlayerLeaveGame(socket: Socket, data: { roomId: string; hasGameStarted: boolean }) {
        const room = this.roomManager.findRoom(data.roomId);
        const player = this.roomManager.findUser(socket.id, room);

        if (data.hasGameStarted) {
            this.server.to(room.organizer.socketId).emit(GameEvents.PlayerAbandonedGame, player.name);
        }
        this.roomManager.removePlayer(room, player.socketId);
        socket.leave(room.id);
        socket.disconnect();
    }

    @SubscribeMessage(GameEvents.EndGame)
    async handleEndGame(socket: Socket, data: { roomId: string; gameAborted: boolean }) {
        const room = this.roomManager.findRoom(data.roomId);
        const sockets = await this.server.in(data.roomId).fetchSockets();

        if (socket.id === room.organizer.socketId) {
            this.server.to(room.id).emit(data.gameAborted ? GameEvents.GameAborted : GameEvents.EndGame);
            this.server.socketsLeave(data.roomId);
            sockets.forEach((playerSocket) => {
                playerSocket.disconnect(true);
            });
            // sockets.forEach((playerSocket) => {
            //     if (playerSocket.rooms.has(data.roomId)) {
            //         playerSocket.leave(room.id);
            //         playerSocket.disconnect();
            //     }
            // });
            this.roomManager.deleteRoom(room);
        }
    }

    @SubscribeMessage(GameEvents.GoodAnswer)
    handleGoodAnswer(socket: Socket, data: { roomId: string; timeStamp: Date }) {
        const room = this.roomManager.findRoom(data.roomId);
        room.answerTimes.push({ userId: socket.id, timeStamp: data.timeStamp.getTime() });
    }

    @SubscribeMessage(GameEvents.QuestionChoiceSelect)
    handleQuestionChoiceSelect(_: Socket, data: { roomId: string; questionChoiceIndex: number }) {
        const organizerId = this.roomManager.findRoom(data.roomId).organizer.socketId;
        this.server.to(organizerId).emit(GameEvents.QuestionChoiceSelect, data.questionChoiceIndex);
    }

    @SubscribeMessage(GameEvents.QuestionChoiceUnselect)
    handleQuestionChoiceUnselect(_: Socket, data: { roomId: string; questionChoiceIndex: number }) {
        const organizerId = this.roomManager.findRoom(data.roomId).organizer.socketId;
        this.server.to(organizerId).emit(GameEvents.QuestionChoiceUnselect, data.questionChoiceIndex);
    }

    @SubscribeMessage(GameEvents.GiveBonus)
    handleGiveBonus(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        const quickestPlayer = this.roomManager.getQuickestTime(room);
        if (quickestPlayer) {
            const player = this.roomManager.findUser(quickestPlayer.userId, room) as Player;
            player.bonusCount++;
            this.server.to(quickestPlayer.userId).emit(GameEvents.GiveBonus);
        }
    }

    // C'est le joueur qui doit envoyer cet événement pour que ses points soient mis à jour
    @SubscribeMessage(GameEvents.AddPointsToPlayer)
    handleAddPointsToPlayer(socket: Socket, data: { roomId: string; points: number }) {
        const room = this.roomManager.findRoom(data.roomId);
        this.roomManager.addPointsToPlayer(socket.id, data.points, room);
        const player = this.roomManager.findUser(socket.id, room) as Player;
        this.server.to(room.organizer.socketId).emit(GameEvents.AddPointsToPlayer, { pointsToAdd: data.points, name: player.name });
    }

    @SubscribeMessage(GameEvents.NextQuestion)
    handleNextQuestion(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        this.roomManager.resetAnswerTimes(room);
        this.server.to(roomId).emit(GameEvents.NextQuestion);
    }

    // TODO : faire l'événement de déconnexion
}
