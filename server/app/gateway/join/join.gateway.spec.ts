import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { JoinGateway } from './join.gateway';

describe('JoinGateway', () => {
    let gateway: JoinGateway;
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
                JoinGateway,
                {
                    provide: Logger,
                    useValue: logger,
                },
                RoomManagerService,
            ],
        }).compile();

        gateway = module.get<JoinGateway>(JoinGateway);
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
            bannedNames: ['bannedName1'],
            answerTimes: [],
        });
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('handleCreateRoom() should create a new room and join the socket', () => {
        const quizId = '2';
        const createdRoomId = gateway.handleCreateRoom(socket, quizId);

        expect(createdRoomId).toBeDefined();
        expect(roomManagerServiceMock.rooms).toContainEqual(expect.objectContaining({ id: createdRoomId, quizId }));
        expect(socket.join.calledOnce).toBeTruthy();
    });

    it('handleJoinRoom() should allow joining an existing room', () => {
        const roomId = 'testId';
        const result = gateway.handleJoinRoom(socket, roomId);
        expect(result).toEqual({ roomState: 'OK', quizId: '1' });
        expect(roomManagerServiceMock.rooms[0].players).toContainEqual(expect.objectContaining({ socketId: socket.id }));
        expect(socket.join.calledOnce).toBeTruthy();
    });

    it('handleJoinRoom() should not allow joining a locked room', () => {
        const roomId = 'testId';
        roomManagerServiceMock.rooms[0].isLocked = true;
        const result = gateway.handleJoinRoom(socket, roomId);
        expect(result).toEqual({ roomState: 'IS_LOCKED', quizId: null });
    });

    it('handleJoinRoom() should handle joining an invalid room', () => {
        const invalidRoomId = 'invalidId';
        const result = gateway.handleJoinRoom(socket, invalidRoomId);
        expect(result).toEqual({ roomState: 'INVALID', quizId: null });
    });

    it('handleChooseName() should choose a name if it is valid', () => {
        const roomId = 'testId';
        const name = 'newName';
        const room = roomManagerServiceMock.findRoom(roomId);
        roomManagerServiceMock.addPlayerToRoom(room, socket.id);

        const isNameTakenSpy = jest.spyOn(roomManagerServiceMock, 'isNameTaken');
        const isBannedNameSpy = jest.spyOn(roomManagerServiceMock, 'isBannedName');

        const result = gateway.handleChooseName(socket, name);

        expect(result).toBe(true);
        expect(isNameTakenSpy).toHaveBeenCalledWith(roomManagerServiceMock.rooms[0], name);
        expect(isBannedNameSpy).toHaveBeenCalledWith(roomManagerServiceMock.rooms[0], name);
    });

    it('handleChooseName() should not choose a name if it is taken or is banned', () => {
        const roomId = 'testId';
        const bannedName = 'bannedName1';
        const room = roomManagerServiceMock.findRoom(roomId);
        roomManagerServiceMock.addPlayerToRoom(room, socket.id);

        const isNameTakenSpy = jest.spyOn(roomManagerServiceMock, 'isNameTaken');
        const isBannedNameSpy = jest.spyOn(roomManagerServiceMock, 'isBannedName');

        const result = gateway.handleChooseName(socket, bannedName);

        expect(result).toBe(false);
        expect(isNameTakenSpy).toHaveBeenCalledWith(roomManagerServiceMock.rooms[0], bannedName);
        expect(isBannedNameSpy).toHaveBeenCalledWith(roomManagerServiceMock.rooms[0], bannedName);
    });

    it('handleSuccessfulJoin() should emit event PlayerHasJoined to the server', () => {
        const data = { roomId: 'testId', name: 'newPlayer' };
        const roomId = 'testId';
        stub(socket, 'rooms').value(new Set([roomId]));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual('playerHasJoined');
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleSuccessfulJoin(socket, data);
    });
});
