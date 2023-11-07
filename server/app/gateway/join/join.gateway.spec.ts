import { Quiz } from '@app/model/database/quiz';
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
            quiz: {} as Quiz,
            organizer: { socketId: 'organizerId', name: 'Organisateur' },
            players: [
                { socketId: 'playerId1', name: 'name1', points: 50, bonusCount: 0 },
                { socketId: 'playerId2', name: 'name2', points: 200, bonusCount: 1 },
            ],
            isLocked: false,
            bannedNames: ['bannedName1'],
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

    it('handleJoinRoom() should not allow joining a locked room', () => {
        const roomId = 'testId';
        gateway.handleJoinRoom(socket, roomId);
        expect(socket.join.calledWith(roomId)).toBeTruthy();
    });

    it('handleSuccessfulJoin() should emit event PlayerHasJoined to the server', () => {
        const data = { roomId: 'testId', name: 'newPlayer' };
        const roomId = 'testId';
        stub(socket, 'rooms').value(new Set([roomId]));
        server.to.returns({
            emit: (event: string, playerName: string) => {
                expect(event).toEqual('playerHasJoined');
                expect(playerName).toEqual(data.name);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleSuccessfulJoin(socket, data);
    });
});
