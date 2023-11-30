import { AnswerTime, Organizer, Player, Room } from '@app/interfaces/room';
import { Quiz } from '@app/model/database/quiz';
import { ChatMessage } from '@common/chat-message';
import { Results } from '@common/player-info';
import { QuestionChartData } from '@common/question-chart-data';
import { Injectable } from '@nestjs/common';
import * as randomstring from 'randomstring';

@Injectable()
export class RoomManagerService {
    rooms: Room[];

    constructor() {
        this.rooms = [];
    }

    createNewRoom(quiz: Quiz, organizerId: string) {
        const roomId = this.createRoomId();
        this.rooms.push({
            id: roomId,
            quiz,
            organizer: { socketId: organizerId, name: 'Organisateur' },
            players: [],
            isLocked: false,
            bannedNames: [],
            answerTimes: [],
            timer: null,
            results: [],
            chatMessage: [],
            questionsChartData: [],
            submissionCount: 0,
            qrlAnswers: [],
        });

        return roomId;
    }

    addPlayerToRoom(room: Room, playerId: string, name: string) {
        const res = this.findPlayer(playerId, room);
        if (!res) {
            room.players.push({ socketId: playerId, name, points: 0, bonusCount: 0, canChat: true, hasSubmitted: false });
        }
    }

    addBannedNameToRoom(room: Room, name: string) {
        room.bannedNames.push(name);
    }

    addPointsToPlayer(playerId: string, points: number, room: Room) {
        const player = this.findPlayer(playerId, room);
        player.points += points;
    }

    findRoom(roomId: string): Room | undefined {
        return this.rooms.find((room) => room.id === roomId);
    }

    findUser(id: string, room: Room): Player | Organizer {
        const player = this.findPlayer(id, room);
        return player ?? room.organizer;
    }

    findPlayer(id: string, room: Room): Player | undefined {
        return room.players.find((currentPlayer) => currentPlayer.socketId === id);
    }

    findPlayerByName(room: Room, name: string): Player | undefined {
        return room.players.find((user) => user.name === name);
    }

    removePlayer(room: Room, playerId: string) {
        if (room) {
            room.players = room.players.filter((player) => player.socketId !== playerId);
        }
    }

    deleteRoom(room: Room) {
        this.rooms = this.rooms.filter((currentRoom) => currentRoom.id !== room.id);
    }

    getQuickestTime(room: Room): AnswerTime | null {
        const hasSomeoneSubmitted = room.answerTimes.some((answerTime) => answerTime.timeStamp !== null);
        if (!hasSomeoneSubmitted) {
            const nbOfGoodAnswers = room.answerTimes.length;
            if (nbOfGoodAnswers === 1) {
                const quickestPlayer = room.answerTimes[0];
                return quickestPlayer;
            }
            return null;
        }

        room.answerTimes = room.answerTimes.filter((answerTime) => answerTime.timeStamp !== null);
        const fastestPlayer = room.answerTimes.reduce((currentFastestPlayer, currentPlayer) => {
            if (currentPlayer.timeStamp < currentFastestPlayer.timeStamp) {
                return currentPlayer;
            }
            return currentFastestPlayer;
        }, room.answerTimes[0]);

        const fastestPlayersCount = room.answerTimes.reduce(
            (count: number, currentPlayer: AnswerTime) => (currentPlayer.timeStamp === fastestPlayer.timeStamp ? ++count : count),
            0,
        );

        if (fastestPlayersCount > 1) {
            return null;
        }

        return fastestPlayer;
    }

    resetAnswerTimes(room: Room) {
        room.answerTimes = [];
    }

    processUsername(data: { name: string; roomId: string; socketId: string }) {
        const room = this.findRoom(data.roomId);
        const nameExists = this.isNameTaken(room, data.name);
        const isBannedName = this.isBannedName(room, data.name);
        const isNameValid = !nameExists && !isBannedName;

        return isNameValid;
    }

    processJoinRoom(data: { socketId: string; roomId: string }) {
        const room = this.findRoom(data.roomId);

        if (!room) {
            return { roomState: 'INVALID', quiz: null };
        }

        if (room.isLocked) {
            return { roomState: 'IS_LOCKED', quiz: null };
        }

        return { roomState: 'OK', quiz: room.quiz };
    }

    getRoomPlayers(roomId: string) {
        const room = this.findRoom(roomId);
        return room.players.map((player) => player.name);
    }

    getPlayerName(roomId: string, playerId: string) {
        const room = this.findRoom(roomId);
        const player = this.findPlayer(playerId, room);
        return player?.name;
    }

    getRoomQuiz(roomId: string): Quiz {
        return this.findRoom(roomId).quiz;
    }

    getResults(roomId: string): Results[] {
        return this.findRoom(roomId).results;
    }

    postResults(roomId: string, results: Results[]) {
        const room = this.findRoom(roomId);
        room.results = results;
    }

    getChatMessages(roomId: string) {
        return this.findRoom(roomId).chatMessage;
    }

    postChatMessages(roomId: string, chatMessages: ChatMessage[]) {
        const room = this.findRoom(roomId);
        room.chatMessage = chatMessages;
    }

    postQuestionsChartData(roomId: string, questionsChartData: QuestionChartData[]) {
        const room = this.findRoom(roomId);
        room.questionsChartData = questionsChartData;
    }

    getQuestionsChartData(roomId: string) {
        return this.findRoom(roomId).questionsChartData;
    }

    private createRoomId() {
        let roomId = '';
        let roomExists: Room;

        do {
            roomId = randomstring.generate({
                charset: 'numeric',
                length: 4,
            });
            roomExists = this.findRoom(roomId);
        } while (roomExists);

        return roomId;
    }

    private isNameTaken(room: Room, name: string) {
        if (name.toLowerCase() === 'organisateur') {
            return true;
        }

        const nameExists = room.players.find((player) => player.name.toLowerCase() === name.toLowerCase());
        return Boolean(nameExists);
    }

    private isBannedName(room: Room, name: string) {
        const isBanned = room.bannedNames.find((bannedName) => bannedName.toLowerCase() === name.toLowerCase());
        return Boolean(isBanned);
    }
}
