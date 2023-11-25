import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { QTypes } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { PlayerSubmission } from '@common/player-submission';
import { PointsToAdd } from '@common/points-to-add';
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
            const organizer = room.organizer.socketId;
            this.roomManager.removePlayer(room, player.socketId);

            if (data.isInGame) {
                if (player.hasSubmitted) {
                    --room.submissionCount;
                }
                this.server.to(data.roomId).emit(GameEvents.PlayerAbandonedGame, player.name);
                if (room.submissionCount === room.players.length) {
                    this.server.to(organizer).emit(GameEvents.AllSubmissionReceived);
                }
            }
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
    handleGoodAnswer(socket: Socket, playerAnswer: PlayerSubmission) {
        const room = this.roomManager.findRoom(playerAnswer.roomId);
        const timeStamp = new Date();
        if (room) {
            room.answerTimes.push({ userId: socket.id, timeStamp: playerAnswer.hasSubmitted ? timeStamp.getTime() : null });
            const organizer = room.organizer.socketId;
            this.server.to(organizer).emit(GameEvents.GoodAnswer, playerAnswer.hasSubmitted);
        }
    }

    @SubscribeMessage(GameEvents.RemoveAnswerTime)
    handleRemoveAnswerTime(_: Socket, data: { roomId: string; userIdToRemove: string }) {
        const room = this.roomManager.findRoom(data.roomId);
        if (room) {
            room.answerTimes = room.answerTimes.filter((answerTime) => answerTime.userId !== data.userIdToRemove);
        }
    }

    @SubscribeMessage(GameEvents.BadAnswer)
    handleBadAnswer(_: Socket, playerAnswer: PlayerSubmission) {
        const room = this.roomManager.findRoom(playerAnswer.roomId);
        const organizer = room.organizer.socketId;
        this.server.to(organizer).emit(GameEvents.BadAnswer, playerAnswer.hasSubmitted);
    }

    @SubscribeMessage(GameEvents.ToggleSelect)
    handleToggleChoice(socket: Socket, data: { roomId: string; questionChoiceIndex: number; isSelect: boolean }) {
        const room = this.roomManager.findRoom(data.roomId);
        const organizer = this.roomManager.findRoom(data.roomId).organizer.socketId;
        const player = this.roomManager.findPlayer(socket.id, room);
        this.server.to(organizer).emit(data.isSelect ? GameEvents.QuestionChoiceSelect : GameEvents.QuestionChoiceUnselect, data.questionChoiceIndex);

        // TODO: à changer pour envoyer le nom dans un seul emit
        // (Perso je pense qu'on peut enlever le commentaire et laissé ça comme ça (Bryan))
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
    handleAddPointsToPlayer(socket: Socket, pointsOfPlayer: PointsToAdd) {
        const minPoints = 0;
        const maxPoints = 100;
        const room = this.roomManager.findRoom(pointsOfPlayer.roomId);
        const validPoints = pointsOfPlayer.pointsToAdd >= minPoints && pointsOfPlayer.pointsToAdd <= maxPoints;

        if (validPoints && room) {
            const player = pointsOfPlayer.name
                ? this.roomManager.findPlayerByName(room, pointsOfPlayer.name)
                : this.roomManager.findPlayer(socket.id, room);
            if (player) {
                pointsOfPlayer.name = player.name;
                this.roomManager.addPointsToPlayer(player.socketId, pointsOfPlayer.pointsToAdd, room);
                this.server.to(room.organizer.socketId).emit(GameEvents.AddPointsToPlayer, pointsOfPlayer);
                this.server.to(player.socketId).emit(GameEvents.AddPointsToPlayer, pointsOfPlayer);
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
    handleSubmitAnswer(socket: Socket, playerSubmission: PlayerSubmission) {
        const room = this.roomManager.findRoom(playerSubmission.roomId);
        const player = this.roomManager.findPlayer(socket.id, room);
        const organizer = room.organizer.socketId;
        player.hasSubmitted = playerSubmission.hasSubmitted;
        playerSubmission.name = player.name;
        const isSubmissionQCM = playerSubmission.questionType === QTypes.QCM;
        this.server.to(organizer).emit(isSubmissionQCM ? GameEvents.SubmitQCM : GameEvents.SubmitQRL, playerSubmission);
        room.submissionCount++;
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
