import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Constants, QTypes } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { PlayerPoints } from '@common/player-points';
import { PlayerSubmission } from '@common/player-submission';
import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class GameGateway {
    @WebSocketServer() private server: Server;

    constructor(private roomManager: RoomManagerService) {}

    @SubscribeMessage(GameEvents.PlayerLeaveGame)
    handlePlayerLeaveGame(socket: Socket, data: { roomId: string; isInGame: boolean }) {
        const room = this.roomManager.findRoom(data.roomId);
        if (room) {
            const player = this.roomManager.findPlayer(socket.id, room);
            const organizer = room.organizer.socketId;

            if (player) {
                this.roomManager.removePlayer(room, player.socketId);
                if (data.isInGame) {
                    if (player.hasSubmitted) {
                        --room.submissionCount;
                    }
                    this.server.to(data.roomId).emit(GameEvents.PlayerAbandonedGame, player.name);
                    if (room.submissionCount === room.players.length) {
                        this.server.to(organizer).emit(GameEvents.AllPlayersSubmitted);
                    }
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
            room.answerTimes.push({ userId: socket.id, timeStamp: playerAnswer.hasSubmittedBeforeEnd ? timeStamp.getTime() : null });
        }
    }

    @SubscribeMessage(GameEvents.RemoveAnswerTime)
    handleRemoveAnswerTime(_: Socket, data: { roomId: string; userIdToRemove: string }) {
        const room = this.roomManager.findRoom(data.roomId);
        if (room) {
            room.answerTimes = room.answerTimes.filter((answerTime) => answerTime.userId !== data.userIdToRemove);
        }
    }

    @SubscribeMessage(GameEvents.ToggleSelect)
    handleToggleChoice(_: Socket, data: { roomId: string; questionChoiceIndex: number; isSelect: boolean }) {
        const room = this.roomManager.findRoom(data.roomId);
        if (room) {
            const organizer = room.organizer.socketId;
            this.server
                .to(organizer)
                .emit(data.isSelect ? GameEvents.QuestionChoiceSelect : GameEvents.QuestionChoiceUnselect, data.questionChoiceIndex);
        }
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
    handleAddPointsToPlayer(socket: Socket, playerPoints: PlayerPoints) {
        const room = this.roomManager.findRoom(playerPoints.roomId);
        const validPoints = playerPoints.pointsToAdd >= 0 && playerPoints.pointsToAdd <= Constants.MAX_POINTS;

        if (validPoints && room) {
            const player = playerPoints.name
                ? this.roomManager.findPlayerByName(room, playerPoints.name)
                : this.roomManager.findPlayer(socket.id, room);
            if (player) {
                playerPoints.name = player.name;
                this.roomManager.addPointsToPlayer(player.socketId, playerPoints.pointsToAdd, room);
                this.server.to(room.organizer.socketId).emit(GameEvents.AddPointsToPlayer, playerPoints);
                this.server.to(player.socketId).emit(GameEvents.AddPointsToPlayer, playerPoints);
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
        player.hasSubmitted = playerSubmission.hasSubmittedBeforeEnd;
        playerSubmission.name = player.name;
        const isQRL = playerSubmission.questionType === QTypes.QRL;

        if (isQRL) {
            room.qrlAnswers.push(playerSubmission);
        }
        this.server.to(organizer).emit(GameEvents.SubmitAnswer, playerSubmission);
        room.submissionCount++;

        if (room.submissionCount === room.players.length) {
            this.server.to(organizer).emit(GameEvents.AllPlayersSubmitted, isQRL ? room.qrlAnswers : null);
            room.qrlAnswers = [];
        }
    }

    @SubscribeMessage(GameEvents.SaveChartData)
    handleSaveChartData(_: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        this.server.to(room.organizer.socketId).emit(GameEvents.SaveChartData);
    }

    @SubscribeMessage(GameEvents.FieldInteraction)
    handleFieldInteraction(socket: Socket, roomId: string) {
        const room = this.roomManager.findRoom(roomId);
        if (room) {
            const organizer = room.organizer.socketId;
            const player = this.roomManager.findPlayer(socket.id, room);
            if (player) {
                this.server.to(organizer).emit(GameEvents.FieldInteraction, player.name);
            }
        }
    }

    @SubscribeMessage(GameEvents.QRLAnswerUpdate)
    handleQRLAnswerUpdate(_: Socket, data: { roomId: string; hasModifiedText: boolean }) {
        const room = this.roomManager.findRoom(data.roomId);
        if (room) {
            const organizer = room.organizer.socketId;
            if (organizer) {
                this.server.to(organizer).emit(GameEvents.QRLAnswerUpdate, data.hasModifiedText);
            }
        }
    }
}
