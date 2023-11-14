import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { GameEvents } from '@common/game.events';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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
    handlePlayerLeaveGame(socket: Socket, data: { roomId: string; isInGame: boolean }) {
        const room = this.roomManager.findRoom(data.roomId);
        if (room) {
            const player = this.roomManager.findPlayer(socket.id, room);

            if (data.isInGame) {
                this.server.to(data.roomId).emit(GameEvents.PlayerAbandonedGame, player.name);
            }
            this.roomManager.removePlayer(room, player.socketId);
            if (room.players.length === 0 && room.organizer.socketId === '') {
                this.roomManager.deleteRoom(room);
            }
            socket.leave(room.id);
            socket.disconnect();
        }
    }

    @SubscribeMessage(GameEvents.EndGame)
    async handleEndGame(socket: Socket, data: { roomId: string; gameAborted: boolean }) {
        const room = this.roomManager.findRoom(data.roomId);
        if (room) {
            if (data.gameAborted) {
                clearInterval(room.timer);
                socket.to(room.id).emit(GameEvents.GameAborted);
                this.server.socketsLeave(data.roomId);
                this.server.in(data.roomId).disconnectSockets(true);
                this.roomManager.deleteRoom(room);
            } else {
                if (room.players.length > 0) {
                    room.organizer.socketId = '';
                } else {
                    this.roomManager.deleteRoom(room);
                }
                socket.leave(room.id);
                socket.disconnect();
            }
        }
    }

    @SubscribeMessage(GameEvents.GoodAnswerOnClick)
    handleGoodAnswerOnClick(socket: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        const timeStamp = new Date();
        room.answerTimes.push({ userId: socket.id, timeStamp: timeStamp.getTime() });
        const organizer = room.organizer.socketId;
        this.server.to(organizer).emit(GameEvents.GoodAnswerOnClick);
    }

    @SubscribeMessage(GameEvents.GoodAnswerOnFinishedTimer)
    handleGoodAnswerOnFinishedTimer(socket: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        const timeStamp = new Date();
        room.answerTimes.push({ userId: socket.id, timeStamp: timeStamp.getTime() });
        const organizer = room.organizer.socketId;
        this.server.to(organizer).emit(GameEvents.GoodAnswerOnFinishedTimer);
    }

    @SubscribeMessage(GameEvents.BadAnswerOnClick)
    handleBadAnswerOnClick(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        const organizer = room.organizer.socketId;
        this.server.to(organizer).emit(GameEvents.BadAnswerOnClick);
    }

    @SubscribeMessage(GameEvents.BadAnswerOnFinishedTimer)
    handleBadAnswerOnFinishedTimer(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        const organizer = room.organizer.socketId;
        this.server.to(organizer).emit(GameEvents.BadAnswerOnFinishedTimer);
    }

    @SubscribeMessage(GameEvents.QuestionChoiceSelect)
    handleQuestionChoiceSelect(socket: Socket, data: { roomId: string; questionChoiceIndex: number }) {
        const room = this.roomManager.findRoom(data.roomId);
        const organizer = this.roomManager.findRoom(data.roomId).organizer.socketId;
        const player = this.roomManager.findPlayer(socket.id, room);
        this.server.to(organizer).emit(GameEvents.QuestionChoiceSelect, data.questionChoiceIndex);
        this.server.to(organizer).emit(GameEvents.QuestionChoiceSelect, player.name);
    }

    @SubscribeMessage(GameEvents.QuestionChoiceUnselect)
    handleQuestionChoiceUnselect(_: Socket, data: { roomId: string; questionChoiceIndex: number }) {
        const organizer = this.roomManager.findRoom(data.roomId).organizer.socketId;
        this.server.to(organizer).emit(GameEvents.QuestionChoiceUnselect, data.questionChoiceIndex);
    }

    @SubscribeMessage(GameEvents.GiveBonus)
    handleGiveBonus(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        const quickestPlayer = this.roomManager.getQuickestTime(room);
        if (quickestPlayer) {
            const player = this.roomManager.findPlayer(quickestPlayer.userId, room);
            player.bonusCount++;
            this.server.to(quickestPlayer.userId).emit(GameEvents.GiveBonus);
            this.server.to(room.organizer.socketId).emit(GameEvents.BonusUpdate, player.name);
        }
    }

    @SubscribeMessage(GameEvents.AddPointsToPlayer)
    handleAddPointsToPlayer(socket: Socket, data: { roomId: string; points: number }) {
        const minPoints = 0;
        const maxPoints = 100;
        const room = this.roomManager.findRoom(data.roomId);
        const validPoints = data.points >= minPoints && data.points <= maxPoints;

        if (validPoints && room) {
            this.roomManager.addPointsToPlayer(socket.id, data.points, room);
            const player = this.roomManager.findPlayer(socket.id, room);
            this.server.to(room.organizer.socketId).emit(GameEvents.AddPointsToPlayer, { pointsToAdd: data.points, name: player.name });
            this.server.to(socket.id).emit(GameEvents.AddPointsToPlayer, { pointsToAdd: data.points, name: player.name });
        }
    }

    @SubscribeMessage(GameEvents.NextQuestion)
    handleNextQuestion(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        this.roomManager.resetAnswerTimes(room);
        this.server.to(roomId).emit(GameEvents.NextQuestion);
    }

    @SubscribeMessage(GameEvents.ShowResults)
    handleShowResults(_: Socket, roomId: string) {
        this.server.to(roomId).emit(GameEvents.ShowResults);
    }

    @SubscribeMessage(GameEvents.SendResults)
    handleSendResults(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        this.server.to(room.organizer.socketId).emit(GameEvents.SendResults);
    }

    @SubscribeMessage(GameEvents.SubmitQuestionOnClick)
    handleSubmitQuestionOnClick(socket: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        const organizer = this.roomManager.findRoom(roomId).organizer.socketId;
        const player = this.roomManager.findPlayer(socket.id, room);
        this.server.to(organizer).emit(GameEvents.SubmitQuestionOnClick, player.name);
    }

    @SubscribeMessage(GameEvents.SubmitQuestionOnFinishedTimer)
    handleSubmitQuestionOnFinishedTimer(_: Socket, roomId: string) {
        const organizer = this.roomManager.findRoom(roomId).organizer.socketId;
        this.server.to(organizer).emit(GameEvents.SubmitQuestionOnFinishedTimer);
    }
}
