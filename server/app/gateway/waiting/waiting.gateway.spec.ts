import { Player } from '@app/interfaces/room';
import { Quiz } from '@app/model/database/quiz';
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
            to: jest.fn().mockReturnThis(),
        } as unknown as SinonStubbedInstance<Server>;

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
            quiz: {} as Quiz,
            organizer: { socketId: 'organizerId', name: 'Organisateur' },
            players: [
                { socketId: 'playerId1', name: 'name1', points: 0, bonusCount: 0 },
                { socketId: 'playerId2', name: 'name2', points: 0, bonusCount: 0 },
            ],
            isLocked: false,
            bannedNames: [],
            answerTimes: [],
            timer: null,
            results: [],
            chatMessage: [],
        });

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

    it('handleGetPlayerNames() should return empty list if no players in the room', () => {
        const expectedPlayerNames = [];
        roomManagerServiceMock.rooms[0].players = [] as unknown as Player[];

        stub(socket, 'rooms').value(new Set([roomId]));
        const result = gateway.handleGetPlayerNames(socket, roomId);
        expect(result).toEqual(expectedPlayerNames);
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
        stub(socket, 'rooms').value(new Set([roomId]));

        roomManagerServiceMock.rooms[0].players.push({ socketId: socket.id, name: playerNameToBan, points: 0, bonusCount: 0 });

        const serverEmitMock = jest.spyOn(gateway['server'], 'emit');
        gateway.handleBanName(socket, { roomId, name: playerNameToBan });
        expect(serverEmitMock).toHaveBeenCalledWith(WaitingEvents.BanName, playerNameToBan);

        const bannedName = room.bannedNames.find((name) => name === playerNameToBan);
        const player = roomManagerServiceMock.findPlayerByName(room, playerNameToBan);

        expect(bannedName).toBe(playerNameToBan);
        expect(player).toBeUndefined();
        expect(roomManagerServiceMock.rooms[0].bannedNames).toContain(playerNameToBan);
    });

    it('handleBanName() should not add a banned name to the room and remove player if name does not exist', async () => {
        const room = roomManagerServiceMock.rooms[0];
        const playerNameToBan = 'TestName';
        const serverEmitMock = jest.spyOn(gateway['server'], 'emit');

        gateway.handleBanName(socket, { roomId, name: playerNameToBan });
        expect(serverEmitMock).not.toHaveBeenCalledWith(WaitingEvents.BanName, playerNameToBan);

        const bannedName = room.bannedNames.find((name) => name === playerNameToBan);
        const player = roomManagerServiceMock.findPlayerByName(room, playerNameToBan);

        expect(bannedName).toBeUndefined();
        expect(player).toBeUndefined();
        expect(socket.leave.called).toBeFalsy();
        expect(socket.disconnect.called).toBeFalsy();
        expect(roomManagerServiceMock.rooms[0].bannedNames).not.toContain(playerNameToBan);
    });
});
