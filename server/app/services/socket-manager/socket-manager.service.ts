import { Player, Room, User } from '@app/interfaces/room';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Injectable } from '@nestjs/common';
import * as http from 'http';
import * as randomstring from 'randomstring';
import * as io from 'socket.io';

@Injectable()
export class SocketManagerService {
    private sio: io.Server;
    private rooms: Room[];

    constructor(
        private server: http.Server,
        private roomManager: RoomManagerService,
    ) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        this.rooms = roomManager.rooms;
    }

    handleSockets(): void {
        this.sio.on('connection', (socket) => {
            // to create a new room
            socket.on('createRoom', (quizId: string, callback: (roomId: string) => void) => {
                const roomId = this.roomManager.createNewRoom(quizId, socket.id);
                callback(roomId);
            });

            socket.on('toggleLockRoom', (roomId: string) => {
                const room = this.roomManager.findRoom(roomId);
                room.isLocked = !room.isLocked;
            });

            // to join an existing room
            socket.on('joinRoom', (roomId: string, callback: (roomState: 'IS_LOCKED' | 'INVALID' | 'OK', quizId: string | null) => void) => {
                const roomExists = this.roomManager.findRoom(roomId);
                if (roomExists) {
                    if (!roomExists.isLocked) {
                        this.roomManager.addPlayerToRoom(roomExists, socket.id);
                        socket.join(roomId);
                        callback('OK', roomExists.quizId);
                    } else {
                        callback('IS_LOCKED', null);
                    }
                } else {
                    callback('INVALID', null);
                }
            });

            // double check when player leaves before choosing name
            socket.on('chooseName', (name: string, callback: (validName: boolean) => void) => {
                let wantedPlayer: User;
                const playerRoom = this.rooms.find((room) => {
                    wantedPlayer = room.players.find((player) => player.socketId === socket.id);
                    return wantedPlayer ? true : false;
                });

                const nameExists = this.roomManager.checkName(playerRoom, name);
                const bannedName = this.roomManager.isBannedName(playerRoom, name);
                if (!nameExists && !bannedName) {
                    wantedPlayer.name = name;
                }

                callback(!nameExists && !bannedName);
            });

            socket.on('successfulJoin', (data: { roomId: string; name: string }) => {
                const room = this.roomManager.findRoom(data.roomId);
                socket.to(room.id).emit('playerHasJoined', data.name);
            });

            // allows game to begin
            socket.on('startGame', (roomId: string) => {
                this.sio.to(roomId).emit('gameStarted');
            });

            socket.on('getPlayerNames', (roomId: string, callback: (playerNames: string[]) => void) => {
                const room = this.roomManager.findRoom(roomId);
                const playerNames = room.players.map((player) => player.name);
                callback(playerNames);
            });

            socket.on('banName', (data: { roomId: string; name: string }) => {
                const room = this.roomManager.findRoom(data.roomId);
                this.roomManager.addBannedNameToRoom(room, data.name);
                const player = this.roomManager.findPlayerByName(room, data.name);
                this.roomManager.removeUser(room, player.socketId);
            });

            socket.on('playerLeaveGame', (data: { roomId: string; hasGameStarted: boolean }) => {
                const user = this.roomManager.findUser(socket.id);
                const room = this.roomManager.findRoom(data.roomId);

                const isPlayer = user.name !== room.organizer.name;

                if (data.hasGameStarted && isPlayer) {
                    (user as Player).hasAbandoned = true;
                }
                this.roomManager.removeUser(room, user.socketId);
                socket.to(room.organizer.socketId).emit('AbandonedGame', user.name);
                socket.leave(room.id);
            });

            // Use this function at the end of the game in order to kick everyone from game and delete it
            // case for : 1 ) Organizer leaves game, 2 ) End game button
            socket.on('endGame', async (roomId: string) => {
                const room = this.roomManager.findRoom(roomId);
                const sockets = await this.sio.sockets.fetchSockets();

                socket.to(room.id).emit('gameEnded');
                sockets.forEach((playerSocket) => playerSocket.leave(room.id));
                this.roomManager.deleteRoom(room);
            });

            // clavardage
            socket.on('roomMessage', (data: { message: string; roomId: string }) => {
                const user = this.roomManager.findUser(socket.id);
                const time = new Date();

                const timeString = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
                this.sio.to(data.roomId).emit('roomMessage', `${user.name} (${timeString}) : ${data.message}`);
            });

            socket.on('roomData', (roomId: string, callback: (roomData: Room) => void) => {
                const room = this.roomManager.findRoom(roomId);
                callback(room);
            });

            socket.on('goodAnswer', (data: { roomId: string; timeStamp: Date }) => {
                const room = this.roomManager.findRoom(data.roomId);
                room.answerTimes.push({ userId: socket.id, timeStamp: data.timeStamp.getTime() });
            });

            socket.on('questionChoiceClick', (data: { roomId: string; questionChoiceIndex: number }) => {
                const organizer = this.roomManager.findRoom(data.roomId).organizer.socketId;
                this.sio.to(organizer).emit('addQuestionChoice', data.questionChoiceIndex);
            });

            socket.on('questionChoiceUnselect', (data: { roomId: string; questionChoiceIndex: number }) => {
                const organizer = this.roomManager.findRoom(data.roomId).organizer.socketId;
                this.sio.to(organizer).emit('removeQuestionChoice', data.questionChoiceIndex);
            });

            socket.on('giveBonus', (roomId: string) => {
                const quickestPlayer = this.roomManager.getQuickestTime(this.roomManager.findRoom(roomId));
                const room = this.roomManager.findRoom(roomId);
                if (quickestPlayer) {
                    room.bonusCount++;
                    this.sio.to(quickestPlayer.userId).emit('bonus');
                }
            });

            socket.on('addPointsToPlayer', (data: { roomId: string; name: string; points: number }, callback: (points: number) => void) => {
                const room = this.roomManager.findRoom(data.roomId);
                this.roomManager.addPointsToPlayer(data.roomId, data.name, data.points);
                const player = this.roomManager.findPlayerByName(room, data.name);
                callback(player.points);
            });

            socket.on('nextQuestion', (roomId: string) => {
                const room = this.roomManager.findRoom(roomId);
                this.roomManager.resetTimes(room);
                socket.to(roomId).emit('nextQuestion');
            });

            // socket.on('disconnect', () => {
            //     const user = this.findUser(socket.id);

            //     room.abandonnedPlayers.push(user.name);
            //     socket.leave(room.id);
            //     this.removeUser(room, user.name);
            // });
        });
    }

    /// ///////////////////////////////////////////////////////////////
    // ADDITIONAL SUPPORT FUNCTIONS
    /// ///////////////////////////////////////////////////////////////
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

    private findRoom(roomId: string): Room {
        return this.rooms.find((room) => room.id === roomId);
    }

    private findUserRoom(user: User) {
        for (let i = 0; i < this.rooms.length; i++) {
            for (let j = 0; i < this.rooms[i].players.length; j++) {
                if (this.rooms[i].players[j].socketId === user.socketId) {
                    return this.rooms[i];
                }
            }
        }
    }

    private findUser(id: string): User {
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

    private checkName(room: Room, name: string) {
        const nameExists = room.players.find((player) => player.name.toLowerCase() === name.toLowerCase());
        return nameExists ? true : false;
    }

    private isBannedName(room: Room, name: string) {
        const isBanned = room.bannedNames.find((bannedName) => bannedName === name);
        return isBanned ? true : false;
    }

    private removeUser(room: Room, name: string) {
        for (let i = 0; i < room.players.length; i++) {
            if (room.players[i].name === name) {
                room.players.splice(i, 1);
            }
        }
    }

    private deleteRoom(room: Room) {
        for (let i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].id === room.id) {
                this.rooms.splice(i, 1);
            }
        }
    }
}
