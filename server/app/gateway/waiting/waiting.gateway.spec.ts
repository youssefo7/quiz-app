import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { WaitingGateway } from './waiting.gateway';
import { WaitingEvents } from './waiting.gateway.events';

describe('WaitingGateway', () => {
    let roomId: string;
    let gateway: WaitingGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let roomManagerServiceMock: RoomManagerService;

    beforeEach(async () => {
        roomId = 'testId';
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        server = {
            sockets: {
                sockets: new Map(),
            },
            emit: jest.fn(),
        } as unknown as SinonStubbedInstance<Server>;

        // server = createStubInstance<Server>(Server);

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
            id: roomId,
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

        server = {
            sockets: {
                sockets: new Map(),
            },
            emit: jest.fn(),
        } as unknown as SinonStubbedInstance<Server>;

        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('handleLockRoom() should lock the room when unlockButton clicked by organizer', () => {
        const room = roomManagerServiceMock.rooms[0];

        stub(socket, 'rooms').value(new Set([roomId]));
        gateway.handleLockRoom(socket, roomId);
        expect(room.isLocked).toBe(true);
    });

    it('handleUnlockRoom() should unlock the room when unlockButton clicked by organizer', () => {
        const room = roomManagerServiceMock.rooms[0];
        stub(socket, 'rooms').value(new Set([roomId]));
        room.isLocked = true;

        gateway.handleUnlockRoom(socket, roomId);
        expect(room.isLocked).toBe(false);
    });

    it('handleGetPlayerNames() should return all player names in the room', () => {
        const expectedPlayerNames = ['name1', 'name2'];

        stub(socket, 'rooms').value(new Set([roomId]));
        const result = gateway.handleGetPlayerNames(socket, roomId);
        expect(result).toEqual(expectedPlayerNames);
    });

    it('handleBanName() should add a banned name to the room and remove a player with that name', async () => {
        const room = roomManagerServiceMock.rooms[0];
        const playerNameToBan = 'bannedName';

        const testSocket: SinonStubbedInstance<Socket> = {
            rooms: new Set([roomId]),
            join: jest.fn(),
            id: 'testSocketId',
            emit: jest.fn(socket.emit),
            leave: jest.fn(),
            disconnect: jest.fn(),
        } as unknown as SinonStubbedInstance<Socket>;

        testSocket.join(roomId);
        roomManagerServiceMock.rooms[0].players.push({ socketId: testSocket.id, name: 'bannedName', points: 100, bonusCount: 1 });

        gateway.handleBanName(testSocket, { roomId, name: playerNameToBan });

        const bannedName = room.bannedNames.find((name) => name === playerNameToBan);
        const player = roomManagerServiceMock.findPlayerByName(room, playerNameToBan);

        expect(bannedName).toBe(playerNameToBan);
        expect(player).toBeUndefined();
        expect(roomManagerServiceMock.rooms[0].bannedNames).toContain(playerNameToBan);
        expect(testSocket.emit).toHaveBeenCalledWith(WaitingEvents.BanNotification);
        expect(testSocket.emit).toHaveBeenCalledWith(WaitingEvents.BanNotification);
    });

    // it('handleBanName() should add a banned name to the room and remove a player with that name', async () => {
    //     const room = roomManagerServiceMock.rooms[0];
    //     const playerNameToBan = 'bannedName';

    //     const testSocket: SinonStubbedInstance<Socket> = {
    //         rooms: new Set([roomId]),
    //         join: jest.fn(),
    //         id: 'testSocketId',
    //         emit: jest.fn(),
    //         leave: jest.fn(),
    //         disconnect: jest.fn(),
    //     } as unknown as SinonStubbedInstance<Socket>;

    //     roomManagerServiceMock.rooms[0].players.push({ socketId: testSocket.id, name: 'bannedName', points: 100, bonusCount: 1 });

    //     gateway.handleBanName(testSocket, { roomId, name: playerNameToBan });

    //     const bannedName = room.bannedNames.find((name) => name === playerNameToBan);
    //     const player = roomManagerServiceMock.findPlayerByName(room, playerNameToBan);

    //     expect(bannedName).toBe(playerNameToBan);
    //     expect(player).toBeUndefined();
    //     expect(roomManagerServiceMock.rooms[0].bannedNames).toContain(playerNameToBan);
    //     expect(testSocket.emit.calledWith(WaitingEvents.BanNotification)).toBeTruthy();
    //     // expect(testSocket.leave.calledWith(roomId)).toBeTruthy();
    //     // expect(testSocket.leave).toHaveBeenCalledWith(roomId);
    //     // expect(testSocket.disconnect.called).toBeTruthy();
    //     // expect(server.emit.calledWith(WaitingEvents.BanName, bannedName)).toBeTruthy();
    // });

    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // it('handleBanName() should add a banned name to the room and remove a player with that name', async () => {
    //     const room = roomManagerServiceMock.rooms[0];
    //     const playerNameToBan = 'bannedName';

    //     const testSocket: SinonStubbedInstance<Socket> = {
    //         rooms: new Set([roomId]),
    //         join: jest.fn((roomToJoin) => {
    //             expect(roomToJoin).toBe(roomId);
    //         }),
    //         id: 'testSocketId',
    //         emit: jest.fn((eventName) => {
    //             expect(eventName).toBe(WaitingEvents.BanNotification);
    //         }),
    //         leave: jest.fn((roomToLeave) => {
    //             expect(roomToLeave).toBe(roomId);
    //         }),
    //         disconnect: jest.fn(),
    //     } as unknown as SinonStubbedInstance<Socket>;

    //     roomManagerServiceMock.rooms[0].players.push({ socketId: testSocket.id, name: 'bannedName', points: 100, bonusCount: 1 });

    //     gateway.handleBanName(testSocket, { roomId, name: playerNameToBan });

    //     const bannedName = room.bannedNames.find((name) => name === playerNameToBan);
    //     const player = roomManagerServiceMock.findPlayerByName(room, playerNameToBan);

    //     expect(bannedName).toBe(playerNameToBan);
    //     expect(player).toBeUndefined();
    //     expect(roomManagerServiceMock.rooms[0].bannedNames).toContain(playerNameToBan);
    //     expect(testSocket.emit.called).toBeTruthy();
    //     // toHaveBeenCalledWith(WaitingEvents.BanNotification);

    //     // Additional checks for other methods if needed
    //     expect(testSocket.leave).toHaveBeenCalledWith(roomId);
    //     // expect(testSocket.disconnect.called).toBeTruthy();
    //     // expect(server.emit).toHaveBeenCalledWith(WaitingEvents.BanName, bannedName);
    // });

    // it('handleBanName() should add a banned name to the room and remove a player with that name', async () => {
    //     const room = roomManagerServiceMock.rooms[0];
    //     const playerNameToBan = 'bannedName';

    //     const testSocket: SinonStubbedInstance<Socket> = {
    //         rooms: new Set([roomId]),
    //         join: jest.fn((roomToJoin) => {
    //             expect(roomToJoin).toBe(roomId);
    //         }),
    //         id: 'testSocketId',
    //         emit: jest.fn((eventName) => {
    //             expect(eventName).toBe(WaitingEvents.BanNotification);
    //         }),
    //         leave: jest.fn((roomToLeave) => {
    //             expect(roomToLeave).toBe(roomId);
    //         }),
    //         disconnect: jest.fn(),
    //     } as unknown as SinonStubbedInstance<Socket>;

    //     roomManagerServiceMock.rooms[0].players.push({ socketId: testSocket.id, name: 'bannedName', points: 100, bonusCount: 1 });

    //     gateway.handleBanName(testSocket, { roomId, name: playerNameToBan });

    //     const bannedName = room.bannedNames.find((name) => name === playerNameToBan);
    //     const player = roomManagerServiceMock.findPlayerByName(room, playerNameToBan);

    //     expect(bannedName).toBe(playerNameToBan);
    //     expect(player).toBeUndefined();
    //     expect(roomManagerServiceMock.rooms[0].bannedNames).toContain(playerNameToBan);
    //     expect(testSocket.emit).toHaveBeenCalledWith(WaitingEvents.BanNotification);
    //     expect(testSocket.leave.withArgs(roomId).called).toBeTruthy();
    //     // expect(testSocket.disconnect.called).toBeTruthy();
    //     // expect(server.emit).toHaveBeenCalledWith(WaitingEvents.BanName, bannedName);
    // });

    // it('handleBanName() should add a banned name to the room and remove a player with that name', async () => {
    //     const room = roomManagerServiceMock.rooms[0];
    //     const playerNameToBan = 'bannedName';

    //     const testSocket: SinonStubbedInstance<Socket> = {
    //         rooms: new Set([roomId]),
    //         join: jest.fn(),
    //         id: 'testSocketId',
    //         emit: jest.fn(),
    //         leave: jest.fn(),
    //         disconnect: jest.fn(),
    //     } as unknown as SinonStubbedInstance<Socket>;

    //     roomManagerServiceMock.rooms[0].players.push({ socketId: testSocket.id, name: 'bannedName', points: 100, bonusCount: 1 });

    //     gateway.handleBanName(testSocket, { roomId, name: playerNameToBan });

    //     const bannedName = room.bannedNames.find((name) => name === playerNameToBan);
    //     const player = roomManagerServiceMock.findPlayerByName(room, playerNameToBan);

    //     expect(bannedName).toBe(playerNameToBan);
    //     expect(player).toBeUndefined();
    //     expect(roomManagerServiceMock.rooms[0].bannedNames).toContain(playerNameToBan);
    //     expect(testSocket.emit.calledWith(WaitingEvents.BanNotification)).toBeTruthy();
    //     // expect(testSocket.leave.calledWith(roomId)).toBeTruthy();
    //     // expect(testSocket.leave).toHaveBeenCalledWith(roomId);
    //     // expect(testSocket.disconnect.called).toBeTruthy();
    //     // expect(server.emit.calledWith(WaitingEvents.BanName, bannedName)).toBeTruthy();
    // });

    // TODO: refaire les tests
    // it('handleBanName() should add a banned name to the room and remove a player with that name', async () => {
    //     const room = roomManagerServiceMock.rooms[0];
    //     const playerNameToBan = 'bannedName';

    //     stub(testSocket, 'rooms').value(new Set([roomId]));
    //     testSocket.join(roomId);
    //     roomManagerServiceMock.rooms[0].players.push({ socketId: testSocket.id, name: 'bannedName', points: 100, bonusCount: 1 });

    //     // const socketSpy = jest.spyOn(gateway['server'].sockets.sockets, 'get').mockReturnValue(socket);
    //     // const addBannedNameToRoomSpy = jest.spyOn(roomManagerServiceMock, 'addBannedNameToRoom');
    //     // const removePlayerSpy = jest.spyOn(roomManagerServiceMock, 'removePlayer');

    //     gateway.handleBanName(testSocket, { roomId, name: playerNameToBan });
    //     const bannedName = room.bannedNames.find((name) => name === playerNameToBan);
    //     const player = roomManagerServiceMock.findPlayerByName(room, playerNameToBan);

    //     expect(bannedName).toBe(playerNameToBan);
    //     expect(player).toBeUndefined();
    //     expect(roomManagerServiceMock.rooms[0].bannedNames).toContain(playerNameToBan);
    //     // expect(addBannedNameToRoomSpy).toHaveBeenCalledWith(room, playerNameToBan);
    //     // expect(removePlayerSpy).toHaveBeenCalledWith(room, playerSocketId);
    //     expect(socket.emit.calledOnce).toBeTruthy();
    //     expect(socket.leave.calledOnce).toBeTruthy();
    //     // expect(socket.disconnect.calledOnce).toBeTruthy();
    // });

    // it('handleBanName() should not add a banned name and should not remove a player if the player name is not found', () => {
    //     const roomId = 'testId';
    //     const room = roomManagerServiceMock.rooms[0];
    //     const playerNameToBan = 'nonexistentName';
    //     const addBannedNameToRoomSpy = jest.spyOn(roomManagerServiceMock, 'addBannedNameToRoom');
    //     const removePlayerSpy = jest.spyOn(roomManagerServiceMock, 'removePlayer');

    //     stub(socket, 'rooms').value(new Set([roomId]));
    //     gateway.handleBanName(socket, { roomId, name: playerNameToBan });

    //     const bannedName = room.bannedNames.find((name) => name === playerNameToBan);

    //     expect(bannedName).toBeUndefined();
    //     expect(roomManagerServiceMock.rooms[0].bannedNames).not.toContain(playerNameToBan);
    //     expect(addBannedNameToRoomSpy).not.toHaveBeenCalled();
    //     expect(removePlayerSpy).not.toHaveBeenCalled();
    // });
});
