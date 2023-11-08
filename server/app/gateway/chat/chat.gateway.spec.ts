import { Quiz } from '@app/model/database/quiz';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { ChatEvents } from '@common/chat.events';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, match, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';

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
                { socketId: 'playerId1', name: 'name1', points: 50, bonusCount: 0, canChat: true },
                { socketId: 'playerId2', name: 'name2', points: 200, bonusCount: 1, canChat: true },
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

    it('handleToggleChattingRights() should deny player permission to interact in the chat with others if the player can currently chat', () => {
        const name = 'name1';
        const room = roomManagerServiceMock.findRoom('testId');
        const player = roomManagerServiceMock.findPlayerByName(room, name);
        player.canChat = true;
        stub(socket, 'rooms').value(new Set(['testId']));
        server.to.returns({
            emit: (event: string, canChat: boolean) => {
                expect(event).toEqual(ChatEvents.ToggleChattingRights);
                expect(canChat).toEqual(player.canChat);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleToggleChattingRights(socket, { roomId: 'testId', playerName: 'name1' });
        expect(server.to.withArgs(player.socketId).called).toBeTruthy();
        expect(player.canChat).toEqual(false);
    });

    it('handleToggleChattingRights() should grant player permission to interact chat with others in chat if player can currently cannot chat', () => {
        const name = 'name1';
        const room = roomManagerServiceMock.findRoom('testId');
        const player = roomManagerServiceMock.findPlayerByName(room, name);
        player.canChat = false;
        stub(socket, 'rooms').value(new Set(['testId']));
        server.to.returns({
            emit: (event: string, canChat: boolean) => {
                expect(event).toEqual(ChatEvents.ToggleChattingRights);
                expect(canChat).toEqual(player.canChat);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleToggleChattingRights(socket, { roomId: 'testId', playerName: 'name1' });
        expect(server.to.withArgs(player.socketId).called).toBeTruthy();
        expect(player.canChat).toEqual(true);
    });
});
