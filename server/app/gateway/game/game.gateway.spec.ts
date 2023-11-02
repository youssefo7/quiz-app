import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { GameGateway } from './game.gateway';
import { GameEvents } from './game.gateway.events';

describe('GameGateway', () => {
    let gateway: GameGateway;
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
                GameGateway,
                {
                    provide: Logger,
                    useValue: logger,
                },
                RoomManagerService,
            ],
        }).compile();

        gateway = module.get<GameGateway>(GameGateway);
        roomManagerServiceMock = module.get<RoomManagerService>(RoomManagerService);
        roomManagerServiceMock.rooms = [
            {
                id: 'testId',
                quizId: '1',
                organizer: { socketId: 'organizerId', name: 'Organisateur' },
                players: [
                    { socketId: 'playerId1', name: 'name1', points: 50, bonusCount: 0 },
                    { socketId: 'playerId2', name: 'name2', points: 200, bonusCount: 1 },
                ],
                isLocked: false,
                bannedNames: [],
                answerTimes: [
                    { userId: 'playerId1', timeStamp: 1698849004046 },
                    { userId: 'playerId2', timeStamp: 1698849011696 },
                ],
            },
        ];

        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('handleStartGame() should emit a message to the server when the game is about to begin', () => {
        const roomId = 'testId';
        stub(socket, 'rooms').value(new Set([roomId]));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.StartGame);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleStartGame(socket, roomId);
        expect(server.to.calledWith(roomId)).toBeTruthy();
    });

    it('handlePlayerLeaveGame() should remove the player from the room and emit if game has started and disconnect from server', () => {
        const roomId = 'testId';
        const findRoomSpy = jest.spyOn(roomManagerServiceMock, 'findRoom');
        const findUserSpy = jest.spyOn(roomManagerServiceMock, 'findUser');
        const removePlayerSpy = jest.spyOn(roomManagerServiceMock, 'removePlayer');
        stub(socket, 'rooms').value(new Set([roomId]));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.PlayerAbandonedGame);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handlePlayerLeaveGame(socket, { roomId, hasGameStarted: true });
        expect(server.to.calledWith(roomManagerServiceMock.rooms[0].organizer.socketId)).toBeTruthy();
        expect(findRoomSpy).toHaveBeenCalled();
        expect(findUserSpy).toHaveBeenCalled();
        expect(removePlayerSpy).toHaveBeenCalled();
        expect(socket.leave.calledOnceWith(roomId)).toBeTruthy();
        expect(socket.disconnect.calledOnce).toBeTruthy();
    });

    it('handleGoodAnswer() should add the timestamp of the good answer to a list in rooms', () => {
        const roomId = 'testId';
        const date: Date = new Date();
        stub(socket, 'rooms').value(new Set([roomId]));
        gateway.handleGoodAnswer(socket, { roomId, timeStamp: date });
        expect(roomManagerServiceMock.rooms[0].answerTimes.length).toBeGreaterThan(2);
        expect(roomManagerServiceMock.rooms[0].answerTimes[2].userId).toBe(socket.id);
        expect(roomManagerServiceMock.rooms[0].answerTimes[2].timeStamp).toBe(date.getTime());
    });

    it('handleQuestionChoiceSelect() should show the organizer the total answer choice counts of players of a given question', () => {
        const roomId = 'testId';
        const questionChoiceIndex = 1;
        stub(socket, 'rooms').value(new Set([roomId]));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.QuestionChoiceSelect);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleQuestionChoiceSelect(socket, { roomId, questionChoiceIndex });
        expect(server.to.calledWith(roomManagerServiceMock.rooms[0].organizer.socketId)).toBeTruthy();
    });

    it('handleQuestionChoiceUnelect() should show the organizer the total answer choice counts of players of a given question', () => {
        const roomId = 'testId';
        const questionChoiceIndex = 1;
        stub(socket, 'rooms').value(new Set([roomId]));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.QuestionChoiceUnselect);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleQuestionChoiceUnselect(socket, { roomId, questionChoiceIndex });
        expect(server.to.calledWith(roomManagerServiceMock.rooms[0].organizer.socketId)).toBeTruthy();
    });

    it('handleGiveBonus() should assign the bonus to player with fastest time when all times are different', () => {
        const roomId = 'testId';
        const fastestPlayer = roomManagerServiceMock.getQuickestTime(roomManagerServiceMock.findRoom(roomId));
        const getQuickestTimeSpy = jest.spyOn(roomManagerServiceMock, 'getQuickestTime');
        stub(socket, 'rooms').value(new Set([roomId]));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.GiveBonus);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleGiveBonus(socket, roomId);
        expect(server.to.called).toBeTruthy();
        expect(getQuickestTimeSpy).toHaveBeenCalled();
        expect(getQuickestTimeSpy).toHaveReturnedWith(fastestPlayer);
        expect(roomManagerServiceMock.rooms[0].players[0].bonusCount).toBeGreaterThan(0);
        expect(server.to.calledWith(roomId)).toBeTruthy();
    });

    it('handleGivePointsToPlayer() should give points to player question is answered correctly', () => {
        const roomId = 'testId';
        const playerPoints = 100;
        const user = roomManagerServiceMock.findUser(socket.id, roomManagerServiceMock.findRoom(roomId));
        stub(socket, 'rooms').value(new Set([roomId]));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.AddPointsToPlayer);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleAddPointsToPlayer(socket, { roomId, points: playerPoints });
        expect(server.to.calledWith(user.socketId)).toBeTruthy();
    });

    it('handleNextQuestion() should emit to all users that a new question will appear shortly', () => {
        const roomId = 'testId';
        stub(socket, 'rooms').value(new Set([roomId]));
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.NextQuestion);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleNextQuestion(socket, roomId);
        expect(server.to.called).toBeTruthy();
    });
});

// roomManagerServiceMock = {
//     rooms: [
//         {
//             id: 'testId',
//             quizId: '1',
//             organizer: { socketId: 'organizerId', name: 'Organisateur' },
//             players: [
//                 { socketId: 'playerId1', name: 'name1', points: 50, bonusCount: 0 },
//                 { socketId: 'playerId2', name: 'name2', points: 200, bonusCount: 1 },
//             ],
//             isLocked: false,
//             bannedNames: [],
//             answerTimes: [
//                 { userId: 'playerId1', timeStamp: 1698849004046 },
//                 { userId: 'playerId2', timeStamp: 1698849011696 },
//             ],
//         },
//     ],
//     findRoom: jest.fn(),
//     createNewRoom: jest.fn(),
//     createRoomId: jest.fn(),
//     addPlayerToRoom: jest.fn(),
//     addBannedNameToRoom: jest.fn(),
//     addPointsToPlayer: jest.fn(),
//     findUser: jest.fn(),
//     findPlayerByName: jest.fn(),
//     isNameTaken: jest.fn(),
//     isBannedName: jest.fn(),
//     removePlayer: jest.fn(),
//     deleteRoom: jest.fn(),
//     getQuickestTime: jest.fn(),
//     resetAnswerTimes: jest.fn(),
// };
