// La raison du disable est pour pouvoir mettre un Spy sur une méthodes qui est privée qui est appelé dans la fonction processJoinRoom()
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Room } from '@app/interfaces/room';
import { Test, TestingModule } from '@nestjs/testing';
import { RoomManagerService } from './room-manager.service';

describe('RoomManagerService', () => {
    let roomId: string;
    let room: Room;
    let roomManagerServiceMock: RoomManagerService;

    beforeEach(() => {
        roomId = 'testId';
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RoomManagerService],
        }).compile();

        roomManagerServiceMock = module.get<RoomManagerService>(RoomManagerService);
        roomManagerServiceMock.rooms = [
            {
                id: roomId,
                quizId: '1',
                organizer: { socketId: 'organizerId', name: 'Organisateur' },
                players: [
                    { socketId: 'playerId1', name: 'name1', points: 50, bonusCount: 0 },
                    { socketId: 'playerId2', name: 'name2', points: 200, bonusCount: 1 },
                ],
                isLocked: false,
                bannedNames: ['bannedName1'],
                answerTimes: [
                    { userId: 'playerId2', timeStamp: 90 },
                    { userId: 'playerId1', timeStamp: 100 },
                ],
                timer: null,
            },
        ];
        room = roomManagerServiceMock.rooms[0];
    });

    it('should be defined', () => {
        expect(roomManagerServiceMock).toBeDefined();
    });

    it('should create a new room with a unique id', () => {
        const quizId = '1';
        const organizerId = 'organizerId';
        const newRoomId = roomManagerServiceMock.createNewRoom(quizId, organizerId);

        expect(newRoomId).toBeDefined();
        const roomToFind = roomManagerServiceMock.findRoom(newRoomId);
        expect(roomToFind).toBeDefined();
        expect(roomToFind.quizId).toBe(quizId);
        expect(roomToFind.organizer.socketId).toBe(organizerId);
        expect(roomToFind.players).toHaveLength(0);
        expect(roomToFind.isLocked).toBe(false);
        expect(roomToFind.bannedNames).toHaveLength(0);
        expect(roomToFind.answerTimes).toHaveLength(0);
    });

    it('should add a banned name to the banned names list of a room', () => {
        const nameToBan = 'bannedName';
        roomManagerServiceMock.addBannedNameToRoom(roomManagerServiceMock.rooms[0], nameToBan);

        expect(roomManagerServiceMock.rooms[0].bannedNames).toContain(nameToBan);
    });

    it('should add points to a player in the room', () => {
        const playerId = 'playerId2';
        const pointsToAdd = 30;
        const playerCurrentPoints = roomManagerServiceMock.findPlayer(playerId, room).points;
        roomManagerServiceMock.addPointsToPlayer(playerId, pointsToAdd, room);

        const player = room.players.find((p) => p.socketId === playerId);
        expect(player.points).toEqual(playerCurrentPoints + pointsToAdd);
    });

    it('should return the correct room by room id', () => {
        const foundRoom = roomManagerServiceMock.findRoom(roomId);
        expect(foundRoom.id).toEqual(roomManagerServiceMock.rooms[0].id);
    });

    it('should return the correct user when the user is the organizer of the game', () => {
        const user = roomManagerServiceMock.findUser('organizerId', room);
        expect(user).toEqual(room.organizer);
    });

    it('should return the correct player when finding the player by their socket id', () => {
        const playerIdToFind = 'playerId1';

        const player = roomManagerServiceMock.findPlayer(playerIdToFind, room);
        expect(player?.socketId).toBe(playerIdToFind);
    });

    it('should return the correct player when finding the player by their name', () => {
        const playerName = 'name1';
        const player = roomManagerServiceMock.findPlayerByName(room, playerName);
        expect(player?.name).toBe(playerName);
    });

    it('should remove a player from the list of active players of a room', () => {
        const playerIdToRemove = 'playerId2';
        const nbPlayers = room.players.length;

        roomManagerServiceMock.removePlayer(room, playerIdToRemove);
        expect(room.players.find((player) => player.socketId === playerIdToRemove)).toBeUndefined();
        expect(room.players.length).toEqual(nbPlayers - 1);
    });

    it('should delete a room if room exists', () => {
        const roomToDelete = roomManagerServiceMock.rooms[0];
        roomManagerServiceMock.deleteRoom(roomToDelete);

        expect(roomManagerServiceMock.rooms.find((currentRoom) => currentRoom.id === roomToDelete.id)).toBeUndefined();
        expect(roomManagerServiceMock.rooms).toHaveLength(0);
    });

    it('should return the quickest answer time of a correct answer of the players in a room', () => {
        const fastestPlayer = roomManagerServiceMock.rooms[0].answerTimes[0];
        const quickestTime = roomManagerServiceMock.getQuickestTime(room);
        expect(quickestTime).toEqual(fastestPlayer);
    });

    it('should return null if multiple players have the quickest answer time', () => {
        room.players.push({ socketId: 'playerId3', name: 'name3', points: 200, bonusCount: 1 });
        room.answerTimes.push({ userId: 'playerId3', timeStamp: 90 });
        const quickestTime = roomManagerServiceMock.getQuickestTime(room);
        expect(quickestTime).toBeNull();
    });

    it('should return undefined when no players have the quickest time', () => {
        room.answerTimes = [];
        const quickestTime = roomManagerServiceMock.getQuickestTime(room);
        expect(quickestTime).toEqual(undefined);
    });

    it('should return the correct quickest answer time when the first player has the quickest time', () => {
        room.answerTimes = [
            { userId: 'playerId1', timeStamp: 90 },
            { userId: 'playerId2', timeStamp: 100 },
            { userId: 'playerId3', timeStamp: 80 },
        ];
        const quickestTime = roomManagerServiceMock.getQuickestTime(room);
        expect(quickestTime).toEqual({ userId: 'playerId3', timeStamp: 80 });
    });

    it('should reset answer times after every question is completed', () => {
        roomManagerServiceMock.resetAnswerTimes(room);
        expect(room.answerTimes).toHaveLength(0);
    });

    it('should process the username and return true for valid names', () => {
        room.isLocked = false;
        const newPlayerData = { name: 'NewName', roomId, socketId: 'playerId3' };

        room.players.push({ socketId: 'playerId3', name: '', points: 0, bonusCount: 0 });
        const isNameValid = roomManagerServiceMock.processUsername(newPlayerData);

        expect(isNameValid).toBeTruthy();
        expect(room.players[2].name).toBe('NewName');
    });

    it('should return false for invalid names', () => {
        const data = { name: 'name2', roomId, socketId: 'playerId3' };
        const isNameValid = roomManagerServiceMock.processUsername(data);

        expect(isNameValid).toBeFalsy();
        expect(room.players[1].name).toBe('name2');
    });

    it('should handle joining a room', () => {
        const data = { socketId: 'playerId3', roomId };

        const addPlayerToRoomSpy = jest.spyOn(roomManagerServiceMock as any, 'addPlayerToRoom');
        const result = roomManagerServiceMock.processJoinRoom(data);
        expect(result.roomState).toBe('OK');
        expect(result.quizId).toBe('1');
        expect(room.players.length).toBe(3);
        expect(addPlayerToRoomSpy).toHaveBeenCalled();
    });

    it('should handle joining an invalid room if room id does not exist', () => {
        roomId = 'invalidRoomId';
        const addPlayerToRoomSpy = jest.spyOn(roomManagerServiceMock as any, 'addPlayerToRoom');
        const result = roomManagerServiceMock.processJoinRoom({ socketId: 'playerId3', roomId });

        expect(result.roomState).toBe('INVALID');
        expect(result.quizId).toBe(null);
        expect(addPlayerToRoomSpy).not.toHaveBeenCalled();
    });

    it('should handle joining a locked room', () => {
        const addPlayerToRoomSpy = jest.spyOn(roomManagerServiceMock as any, 'addPlayerToRoom');
        room.isLocked = true;
        const result = roomManagerServiceMock.processJoinRoom({ socketId: 'playerId3', roomId });

        expect(result.roomState).toBe('IS_LOCKED');
        expect(result.quizId).toBe(null);
        expect(addPlayerToRoomSpy).not.toHaveBeenCalled();
    });

    it('should return the names of players in the room', () => {
        const expectedPlayerNames = ['name1', 'name2'];
        const playerNames = roomManagerServiceMock.getRoomPlayers(roomId);

        expect(playerNames).toEqual(expectedPlayerNames);
    });

    it('should provide a unique ID for a new room', () => {
        const newRoomId = roomManagerServiceMock['createRoomId']() as any;
        const roomWithNonUniqueId = roomManagerServiceMock.rooms.forEach((currentRoom) => currentRoom.id === newRoomId);
        expect(roomWithNonUniqueId).toBeUndefined();
    });

    it('should correctly check if a name is banned', () => {
        const bannedName1 = 'BannedName1';
        const nonBannedName = 'nonBannedName';

        const isBannedName1 = roomManagerServiceMock['isBannedName'](room, bannedName1);
        const isBannedName2 = roomManagerServiceMock['isBannedName'](room, nonBannedName);

        expect(isBannedName1).toBeTruthy();
        expect(isBannedName2).toBeFalsy();
    });

    it('should add a new player to the room', () => {
        const newPlayerId = 'playerId3';
        const initNbPlayers = room.players.length;
        roomManagerServiceMock['addPlayerToRoom'](room, newPlayerId);

        expect(room.players.length).toBe(initNbPlayers + 1);
        expect(room.players[room.players.length - 1].socketId).toBe(newPlayerId);
    });

    it('should correctly check if a name is taken in a room', () => {
        const takenName = 'name1';
        const invalidName = 'organisateur';
        const nonTakenName = 'nonTakenName';

        const isTakenName1 = roomManagerServiceMock['isNameTaken'](room, takenName);
        const isInvalidName = roomManagerServiceMock['isNameTaken'](room, invalidName);
        const isTakenName2 = roomManagerServiceMock['isNameTaken'](room, nonTakenName);

        expect(isTakenName1).toBeTruthy();
        expect(isInvalidName).toBeTruthy();
        expect(isTakenName2).toBeFalsy();
    });

    it('should return the correct user when the user is a player', () => {
        const playerId = 'playerId1';
        const user = roomManagerServiceMock.findUser(playerId, room);
        expect(user?.socketId).toBe(playerId);
        expect(user).not.toEqual(room.organizer);
    });
});
