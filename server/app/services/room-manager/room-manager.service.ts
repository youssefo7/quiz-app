import { AnswerTime, Organizer, Player, Room } from '@app/interfaces/room';
import { Injectable } from '@nestjs/common';
import * as randomstring from 'randomstring';

@Injectable()
export class RoomManagerService {
    rooms: Room[] = [];

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
            // abandonnedPlayers: [],
            answerTimes: [],
        });

        return roomId;
    }

    addPlayerToRoom(room: Room, playerId: string) {
        room.players.push({ socketId: playerId, name: '', points: 0, hasAbandoned: false, bonusCount: 0 });
    }

    addBannedNameToRoom(room: Room, name: string) {
        room.bannedNames.push(name);
    }

    addPointsToPlayer(playerId: string, points: number) {
        const player = this.findUser(playerId) as Player;
        player.points += points;
    }

    findRoom(roomId: string): Room {
        return this.rooms.find((room) => room.id === roomId);
    }

    findUser(id: string): Player | Organizer {
        let organizers: Organizer[];

        for (let i = 0; i < this.rooms.length; i++) {
            organizers.push(this.rooms[i].organizer);
            for (let j = 0; i < this.rooms[i].players.length; j++) {
                if (this.rooms[i].players[j].socketId === id) {
                    return this.rooms[i].players[j];
                }
            }
        }

        return organizers.find((organizer) => organizer.socketId === id);
    }

    findPlayerByName(room: Room, name: string) {
        return room.players.find((user) => user.name === name);
    }

    isNameTaken(room: Room, name: string) {
        if (name.toLowerCase() === 'organisateur') {
            return true;
        }

        const nameExists = room.players.find((player) => player.name.toLowerCase() === name.toLowerCase());
        return nameExists ? true : false;
    }

    isBannedName(room: Room, name: string) {
        const isBanned = room.bannedNames.find((bannedName) => bannedName === name);
        return isBanned ? true : false;
    }

    removeUser(room: Room, userId: string) {
        for (let i = 0; i < room.players.length; i++) {
            if (room.players[i].socketId === userId) {
                room.players.splice(i, 1);
            }
        }
    }

    deleteRoom(room: Room) {
        for (let i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].id === room.id) {
                this.rooms.splice(i, 1);
            }
        }
    }

    getQuickestTime(room: Room): AnswerTime | null {
        const player = room.answerTimes.reduce((fastestPlayer, currentPlayer) => {
            if (currentPlayer.timeStamp < fastestPlayer.timeStamp) {
                return (fastestPlayer = currentPlayer);
            }
        }, room.answerTimes[0]);

        const copyAnswerTimes = { ...room.answerTimes }.filter((newPlayer) => newPlayer.timeStamp === player.timeStamp);
        if (copyAnswerTimes.length > 1) {
            return null;
        }

        return player;
    }

    resetTimes(room: Room) {
        room.answerTimes = [];
    }
}
