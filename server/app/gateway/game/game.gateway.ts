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
                if (player.hasSubmitted) {
                    room.submissionCount--;
                }
                this.server.to(data.roomId).emit(GameEvents.PlayerAbandonedGame, player.name);
            }
            this.roomManager.removePlayer(room, player.socketId);
            const isEmptyRoom = room.players.length === 0;
            const isEmptyOrganizerSocketId = room.organizer.socketId === '';
            if (isEmptyRoom && isEmptyOrganizerSocketId) {
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

    @SubscribeMessage(GameEvents.GoodAnswer)
    handleGoodAnswer(socket: Socket, data: { roomId: string; isTimerFinished: boolean }) {
        const room = this.roomManager.findRoom(data.roomId);
        const timeStamp = new Date();
        if (room) {
            room.answerTimes.push({ userId: socket.id, timeStamp: timeStamp.getTime() });
            const organizer = room.organizer.socketId;
            this.server.to(organizer).emit(data.isTimerFinished ? GameEvents.GoodAnswerOnFinishedTimer : GameEvents.GoodAnswerOnClick);
        }
    }

    @SubscribeMessage(GameEvents.RemoveAnswerTime)
    handleRemoveAnswerTime(_: Socket, data: { roomId: string; userIdToRemove: string }) {
        const room = this.roomManager.findRoom(data.roomId);
        if (room) {
            room.answerTimes = room.answerTimes.filter((answerTime) => answerTime.userId !== data.userIdToRemove);
            const organizer = room.organizer.socketId;
            this.server.to(organizer).emit(GameEvents.UnSubmitAnswer);
        }
    }

    @SubscribeMessage(GameEvents.BadAnswer)
    handleBadAnswer(_: Socket, data: { roomId: string; isTimerFinished: boolean }) {
        const room = this.roomManager.findRoom(data.roomId);
        const organizer = room.organizer.socketId;
        this.server.to(organizer).emit(data.isTimerFinished ? GameEvents.BadAnswerOnFinishedTimer : GameEvents.BadAnswerOnClick);
    }

    @SubscribeMessage(GameEvents.ToggleSelect)
    handleToggleChoice(socket: Socket, data: { roomId: string; questionChoiceIndex: number; isSelect: boolean }) {
        const room = this.roomManager.findRoom(data.roomId);
        const organizer = this.roomManager.findRoom(data.roomId).organizer.socketId;
        const player = this.roomManager.findPlayer(socket.id, room);
        this.server.to(organizer).emit(data.isSelect ? GameEvents.QuestionChoiceSelect : GameEvents.QuestionChoiceUnselect, data.questionChoiceIndex);

        // TODO: à changer pour envoyer le nom dans un seul emit
        this.server.to(organizer).emit(GameEvents.FieldInteraction, player.name);
    }

    @SubscribeMessage(GameEvents.QuestionChoicesUnselect)
    handleChoiceArrayUnselect(_: Socket, data: { roomId: string; questionChoiceIndexes: number[] }) {
        const room = this.roomManager.findRoom(data.roomId);
        if (room) {
            const organizer = room.organizer.socketId;
            data.questionChoiceIndexes.forEach((choiceIndex) => {
                this.server.to(organizer).emit(GameEvents.QuestionChoiceUnselect, choiceIndex);
            });
        }
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
    handleAddPointsToPlayer(socket: Socket, data: { roomId: string; points: number; name?: string }) {
        const minPoints = 0;
        const maxPoints = 100;
        const room = this.roomManager.findRoom(data.roomId);
        const validPoints = data.points >= minPoints && data.points <= maxPoints;

        if (validPoints && room) {
            const player = data.name ? this.roomManager.findPlayerByName(room, data.name) : this.roomManager.findPlayer(socket.id, room);
            if (player) {
                this.roomManager.addPointsToPlayer(player.socketId, data.points, room);
                this.server.to(room.organizer.socketId).emit(GameEvents.AddPointsToPlayer, { pointsToAdd: data.points, name: player.name });
                this.server.to(player.socketId).emit(GameEvents.AddPointsToPlayer, { pointsToAdd: data.points, name: player.name });
            }
        }
    }

    @SubscribeMessage(GameEvents.NextQuestion)
    handleNextQuestion(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        room.players.forEach((player) => {
            player.hasSubmitted = false;
        });
        room.submissionCount = 0;
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

    @SubscribeMessage(GameEvents.SubmitAnswer)
    handleSubmitQuestion(socket: Socket, roomId: string) {
        const organizer = this.roomManager.findRoom(roomId).organizer.socketId;
        const room = this.roomManager.findRoom(roomId);
        const player = this.roomManager.findPlayer(socket.id, room);
        this.server.to(organizer).emit(GameEvents.SubmitQuestionOnClick, player.name);
    }

    @SubscribeMessage(GameEvents.SubmitQRL)
    handleSubmitQRL(socket: Socket, data: { roomId: string; answer: string }) {
        const room = this.roomManager.findRoom(data.roomId);
        const playerName = this.roomManager.findPlayer(socket.id, room).name;
        const organizer = room.organizer.socketId;
        this.server.to(organizer).emit(GameEvents.SubmitQRL, { playerName, answer: data.answer });
        room.submissionCount++;
        if (room.submissionCount === room.players.length) {
            this.server.to(organizer).emit(GameEvents.AllSubmissionReceived);
        }
    }

    @SubscribeMessage(GameEvents.SaveChartData)
    handleSaveChartData(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        this.server.to(room.organizer.socketId).emit(GameEvents.SaveChartData);
    }
}
