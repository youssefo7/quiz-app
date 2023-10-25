import { AnswerTime, Room, User } from '@app/interfaces/room';
import { Injectable } from '@nestjs/common';
import * as http from 'http';
import * as randomstring from 'randomstring';
import * as io from 'socket.io';

@Injectable()
export class SocketManagerService {
    private sio: io.Server;
    private rooms: Room[] = [];

    constructor(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
    }

    handleSockets(): void {
        this.sio.on('connection', (socket) => {
            // to create a new room
            socket.on('createRoom', (quizId: string, callback: (roomId: string) => void) => {
                const roomId = this.createRoomId();
                this.rooms.push({
                    id: roomId,
                    quizId,
                    organizer: { socketId: socket.id, name: 'Organisateur' },
                    players: [],
                    isLocked: false,
                    bannedNames: [],
                    abandonnedPlayers: [],
                    answerTimes: [],
                });
                callback(roomId);
            });

            socket.on('toggleLockRoom', (roomId: string) => {
                const room = this.findRoom(roomId);
                room.isLocked = !room.isLocked;
            });

            // to join an existing room
            socket.on('joinRoom', (roomId: string, callback: (roomState: 'IS_LOCKED' | 'INVALID' | 'OK', quizId: string | null) => void) => {
                const roomExists = this.findRoom(roomId);
                if (roomExists) {
                    if (!roomExists.isLocked) {
                        roomExists.players.push({ socketId: socket.id, name: '' });
                        socket.join(roomId);
                        callback('OK', roomExists.quizId);
                    } else {
                        callback('IS_LOCKED', null);
                    }
                } else {
                    callback('INVALID', null);
                }
            });

            socket.on('enterName', (name: string, callback: (validName: boolean) => void) => {
                let newPlayer: User;
                const playerRoom = this.rooms.find((room) => {
                    newPlayer = room.players.find((player) => player.socketId === socket.id);
                    return newPlayer ? true : false;
                });

                const nameExists = this.checkName(playerRoom, name);
                const bannedName = this.isBannedName(playerRoom, name);
                if (!nameExists && !bannedName) {
                    newPlayer.name = name;
                }
                callback(!nameExists && !bannedName ? true : false);
            });

            // allows game to begin
            socket.on('startGame', (roomId: string) => {
                this.sio.to(roomId).emit('gameStarted');
            });

            socket.on('getPlayerNames', (roomId: string, callback: (playerNames: string[]) => void) => {
                const room = this.findRoom(roomId);
                const playerNames = room.players.map((player) => player.name);
                callback(playerNames);
            });

            socket.on('banName', (data: { roomId: string; user: User }) => {
                const room = this.findRoom(data.roomId);
                room.bannedNames.push(data.user.name);
                this.removeUser(room, data.user.name);
            });

            socket.on('playerLeaveGame', () => {
                const user = this.findUser(socket.id);
                const room = this.findUserRoom(user);

                room.abandonnedPlayers.push(user.name);
                socket.leave(room.id);
                this.removeUser(room, user.name);
            });

            // Use this function at the end of the game in order to kick everyone from game and delete it
            // case for : 1 ) Organizer leaves game, 2 ) End game button
            socket.on('endGame', async () => {
                const oganizer = this.findUser(socket.id);
                const room = this.findUserRoom(oganizer);
                const sockets = await this.sio.sockets.fetchSockets();

                socket.to(room.id).emit('gameEnded');
                sockets.forEach((playerSocket) => playerSocket.leave(room.id));
                this.deleteRoom(room);
            });

            // clavardage
            socket.on('roomMessage', (data: { message: string; roomId: string }) => {
                const user = this.findUser(socket.id);
                const time = new Date();

                const timeString = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
                this.sio.to(data.roomId).emit('roomMessage', `${user.name} (${timeString}) : ${data.message}`);
            });

            socket.on('roomData', (roomId: string, callback: (roomData: Room) => void) => {
                const room = this.findRoom(roomId);
                callback(room);
            });

            socket.on('goodAnswer', (data: { roomId: string; timeStamp: Date }) => {
                const room = this.findRoom(data.roomId);
                room.answerTimes.push({ userId: socket.id, timeStamp: data.timeStamp.getTime() });
            });

            socket.on('questionChoiceClick', (data: { roomId: string; questionChoiceIndex: number }) => {
                const organizer = this.findRoom(data.roomId).organizer.socketId;
                this.sio.to(organizer).emit('addQuestionChoice', data.questionChoiceIndex);
            });

            socket.on('questionChoiceUnselect', (data: { roomId: string; questionChoiceIndex: number }) => {
                const organizer = this.findRoom(data.roomId).organizer.socketId;
                this.sio.to(organizer).emit('removeQuestionChoice', data.questionChoiceIndex);
            });

            socket.on('giveBonus', (roomId: string) => {
                const quickestPlayer = this.getQuickestTime(this.findRoom(roomId));
                if (quickestPlayer) {
                    this.sio.to(quickestPlayer.userId).emit('bonus');
                }
            });

            socket.on('nextQuestion', async (roomId: string) => {
                socket.to(roomId).emit('nextQuestion');
            });

            // socket.on('disconnect', () => {
            //     const user = this.findUser(socket.id);
            //     const room = this.findUserRoom(user);

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
        let organizers: User[];

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

    private getQuickestTime(room: Room): AnswerTime | null {
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
}
