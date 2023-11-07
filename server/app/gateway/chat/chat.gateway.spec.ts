import { Quiz } from '@app/model/database/quiz';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, match, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';
import { ChatEvents } from './chat.gateway.events';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
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
                ChatGateway,
                {
                    provide: Logger,
                    useValue: logger,
                },
                RoomManagerService,
            ],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
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
            bannedNames: [],
            answerTimes: [],
            timer: null,
        });
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('handleRoomMessage() should send message if socket in the room', () => {
        stub(socket, 'rooms').value(new Set(['testId']));
        socket.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(ChatEvents.NewRoomMessage);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleRoomMessage(socket, { roomId: 'testId', message: 'Test Message' });
        expect(socket.to.withArgs(roomManagerServiceMock.rooms[0].id)).toBeTruthy();
        expect(socket.emit.calledWith(ChatEvents.NewRoomMessage, match.object)).toBeTruthy();
    });

    it('handleRoomMessage() should not send message if socket not in the room', () => {
        socket.disconnect();
        stub(socket, 'rooms').value(new Set());
        gateway.handleRoomMessage(socket, { roomId: 'testId', message: 'Test Message' });
        expect(socket.emit.called).toBeFalsy();
        expect(socket.to.called).toBeFalsy();
    });
});
