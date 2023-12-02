import { Quiz } from '@app/model/database/quiz';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { ChatMessage } from '@common/chat-message';
import { ChatEvents } from '@common/chat.events';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
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
                { socketId: 'playerId1', name: 'name1', points: 50, bonusCount: 0, canChat: true, hasSubmitted: false },
                { socketId: socket.id, name: 'name2', points: 200, bonusCount: 1, canChat: true, hasSubmitted: false },
            ],
            isLocked: false,
            bannedNames: [],
            answerTimes: [],
            timer: null,
            results: [],
            chatMessage: [],
            questionsChartData: [],
            submissionCount: 0,
            qrlAnswers: [],
        });
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('handleRoomMessage() should send message if socket in the room', () => {
        const name = 'name2';
        const message = 'Test Message';
        const room = roomManagerServiceMock.findRoom('testId');
        const time = new Date();
        const timeString = time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
        stub(socket, 'rooms').value(new Set([room.id]));
        server.to.returns({
            emit: (event: string, chatMessage: ChatMessage) => {
                expect(event).toEqual(ChatEvents.NewRoomMessage);
                expect(chatMessage.authorName).toEqual(name);
                expect(chatMessage.time).toEqual(timeString);
                expect(chatMessage.message).toEqual(message);
                expect(chatMessage.fromSystem).toBeFalsy();
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleRoomMessage(socket, { roomId: 'testId', message });
        expect(server.to.withArgs(roomManagerServiceMock.rooms[0].id)).toBeTruthy();
    });

    it('handleRoomMessage() should not send message if socket is not in the room', () => {
        socket.disconnect();
        stub(socket, 'rooms').value(new Set());
        gateway.handleRoomMessage(socket, { roomId: 'testId', message: 'Test Message' });
        expect(server.emit.called).toBeFalsy();
        expect(server.to.called).toBeFalsy();
    });

    it('handleToggleChattingRights() should grant or deny player permission to interact in the chat with others depending on the player', () => {
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

        player.canChat = false;
        gateway.handleToggleChattingRights(socket, { roomId: 'testId', playerName: 'name1' });
        expect(server.to.withArgs(player.socketId).called).toBeTruthy();
        expect(player.canChat).toEqual(true);
    });
});
