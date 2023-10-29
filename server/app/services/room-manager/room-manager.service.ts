import { AnswerTime, Organizer, Player, Room } from '@app/interfaces/room';
import { Injectable } from '@nestjs/common';
import * as randomstring from 'randomstring';

@Injectable()
export class RoomManagerService {
    rooms: Room[];

    constructor() {
        this.rooms = [];
    }

    createRoomId() {
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

    createNewRoom(quizId: string, organizerId: string) {
        const roomId = this.createRoomId();
        this.rooms.push({
            id: roomId,
            quizId,
            organizer: { socketId: organizerId, name: 'Organisateur' },
            players: [],
            isLocked: false,
            bannedNames: [],
            answerTimes: [],
        });

        return roomId;
    }

    addPlayerToRoom(room: Room, playerId: string) {
        room.players.push({ socketId: playerId, name: '', points: 0, bonusCount: 0 });
    }

    addBannedNameToRoom(room: Room, name: string) {
        room.bannedNames.push(name);
    }

    addPointsToPlayer(playerId: string, points: number, room: Room) {
        const player = this.findUser(playerId, room) as Player;
        player.points += points;
    }

    findRoom(roomId: string): Room {
        return this.rooms.find((room) => room.id === roomId);
    }

    findUser(id: string, room: Room): Player | Organizer {
        const player = room.players.find((currentPlayer) => currentPlayer.socketId === id);
        if (player) {
            return player;
        }

        return room.organizer;
    }

    findPlayerByName(room: Room, name: string): Player {
        return room.players.find((user) => user.name === name);
    }

    isNameTaken(room: Room, name: string) {
        if (name.toLowerCase() === 'organisateur') {
            return true;
        }

        const nameExists = room.players.find((player) => player.name.toLowerCase() === name.toLowerCase());
        return Boolean(nameExists);
    }

    isBannedName(room: Room, name: string) {
        const isBanned = room.bannedNames.find((bannedName) => bannedName === name);
        return Boolean(isBanned);
    }

    removePlayer(room: Room, playerId: string) {
        const playerIndex = room.players.findIndex((player) => player.socketId === playerId);
        const outOfBoundsIndex = -1;

        if (playerIndex !== outOfBoundsIndex) {
            room.players.splice(playerIndex, 1);
        }
    }

    deleteRoom(room: Room) {
        const roomIndex = this.rooms.findIndex((currentRoom) => currentRoom.id === room.id);
        const outOfBoundsIndex = -1;

        if (roomIndex !== outOfBoundsIndex) {
            this.rooms.splice(roomIndex, 1);
        }
    }

    getQuickestTime(room: Room): AnswerTime | null {
        const player = room.answerTimes.reduce((fastestPlayer, currentPlayer) => {
            if (currentPlayer.timeStamp < fastestPlayer.timeStamp) {
                return (fastestPlayer = currentPlayer);
            }
        }, room.answerTimes[0]);

        const fastestPlayersCount = room.answerTimes.reduce(
            (count: number, currentPlayer: AnswerTime) => (currentPlayer.timeStamp === player.timeStamp ? count++ : count),
            0,
        );

        if (fastestPlayersCount > 1) {
            return null;
        }

        return player;
    }

    resetAnswerTimes(room: Room) {
        room.answerTimes = [];
    }
}
