import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { WaitingGateway } from './waiting.gateway';

describe('WaitingGateway', () => {
    let gateway: WaitingGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let roomManagerServiceMock: RoomManagerService;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WaitingGateway,
                {
                    provide: Logger,
                    useValue: logger,
                },
                RoomManagerService,
            ],
        }).compile();

        gateway = module.get<WaitingGateway>(WaitingGateway);
        roomManagerServiceMock = module.get<RoomManagerService>(RoomManagerService);
        roomManagerServiceMock.rooms.push({
            id: 'testId',
            quizId: '1',
            organizer: { socketId: 'organizerId', name: 'Organisateur' },
            players: [
                { socketId: 'playerId1', name: 'name1', points: 50, bonusCount: 0 },
                { socketId: 'playerId2', name: 'name2', points: 200, bonusCount: 1 },
            ],
            isLocked: false,
            bannedNames: [],
            answerTimes: [],
        });
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should lock the room when button clicked by organizer', () => {
        const roomId = 'testId';
        const room = roomManagerServiceMock.rooms[0];

        stub(socket, 'rooms').value(new Set([roomId]));
        gateway.handleToggleLockRoom(socket, roomId);
        expect(room.isLocked).toBe(true);
    });

    it('should unlock the room when button clicked by organizer', () => {
        const roomId = 'testId';
        const room = roomManagerServiceMock.rooms[0];
        stub(socket, 'rooms').value(new Set([roomId]));
        room.isLocked = true;

        gateway.handleToggleLockRoom(socket, roomId);
        expect(room.isLocked).toBe(false);
    });

    it('should return player names in the room', () => {
        const roomId = 'testId';
        const expectedPlayerNames = ['name1', 'name2'];

        stub(socket, 'rooms').value(new Set([roomId]));
        const result = gateway.handleGetPlayerNames(socket, roomId);
        expect(result).toEqual(expectedPlayerNames);
    });

    it('should add a banned name to the room and remove a player with that name', async () => {
        const roomId = 'testId';
        const room = roomManagerServiceMock.rooms[0];
        const playerNameToBan = 'name1';
        stub(socket, 'rooms').value(new Set([roomId]));
        const playerSocketId = 'playerId1';

        const addBannedNameToRoomSpy = jest.spyOn(roomManagerServiceMock, 'addBannedNameToRoom');
        const removePlayerSpy = jest.spyOn(roomManagerServiceMock, 'removePlayer');
        gateway.handleBanName(socket, { roomId, name: playerNameToBan });

        const bannedName = room.bannedNames.find((name) => name === playerNameToBan);
        const player = roomManagerServiceMock.findPlayerByName(room, playerNameToBan);

        expect(bannedName).toBe(playerNameToBan);
        expect(player).toBeUndefined();
        expect(roomManagerServiceMock.rooms[0].bannedNames).toContain(playerNameToBan);
        expect(addBannedNameToRoomSpy).toHaveBeenCalledWith(room, playerNameToBan);
        expect(removePlayerSpy).toHaveBeenCalledWith(room, playerSocketId);
        expect(socket.emit.called).toBeTruthy();
        expect(socket.leave.called).toBeTruthy();
        expect(socket.disconnect.called).toBeTruthy();
    });

    it('should not add a banned name and should not remove a player if the player name is not found', () => {
        const roomId = 'testId';
        const room = roomManagerServiceMock.rooms[0];
        const playerNameToBan = 'nonexistentName';
        const addBannedNameToRoomSpy = jest.spyOn(roomManagerServiceMock, 'addBannedNameToRoom');
        const removePlayerSpy = jest.spyOn(roomManagerServiceMock, 'removePlayer');

        stub(socket, 'rooms').value(new Set([roomId]));
        gateway.handleBanName(socket, { roomId, name: playerNameToBan });

        const bannedName = room.bannedNames.find((name) => name === playerNameToBan);

        expect(bannedName).toBeUndefined();
        expect(roomManagerServiceMock.rooms[0].bannedNames).not.toContain(playerNameToBan);
        expect(addBannedNameToRoomSpy).not.toHaveBeenCalled();
        expect(removePlayerSpy).not.toHaveBeenCalled();
    });
});
