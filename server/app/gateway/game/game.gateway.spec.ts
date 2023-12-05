// Raison: les any sont nécessaire pour tester les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
// Raison: tout les tests sont necessaires, dans leur intégralité, pour tester de manière exhaustive le gateway
/* eslint-disable max-lines */
import { Quiz } from '@app/model/database/quiz';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Constants, QTypes } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { PlayerPoints } from '@common/player-points';
import { PlayerSubmission } from '@common/player-submission';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance, stub } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { GameGateway } from './game.gateway';

describe('GameGateway', () => {
    let roomId: string;
    let gateway: GameGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let roomManagerServiceMock: RoomManagerService;

    beforeEach(async () => {
        roomId = 'testId';
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
                id: roomId,
                quiz: {} as Quiz,
                organizer: { socketId: 'organizerId', name: 'Organisateur' },
                players: [
                    { socketId: 'playerId1', name: 'name1', points: 50, bonusCount: 0, canChat: true, hasSubmitted: false },
                    { socketId: 'playerId2', name: 'name2', points: 200, bonusCount: 1, canChat: false, hasSubmitted: false },
                    { socketId: socket.id, name: 'testName', points: 0, bonusCount: 0, canChat: true, hasSubmitted: false },
                ],
                isLocked: false,
                bannedNames: [],
                answerTimes: [
                    { userId: 'playerId1', timeStamp: 1698849004046 },
                    { userId: 'playerId2', timeStamp: 1698849011696 },
                    { userId: socket.id, timeStamp: 1298849004046 },
                ],
                timer: null,
                results: [],
                chatMessage: [],
                questionsChartData: [],
                submissionCount: 0,
                qrlAnswers: [],
            },
        ];

        gateway['server'] = server;
        stub(socket, 'rooms').value(new Set([roomId]));
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('handlePlayerLeaveGame() should delete the room if there are no more players in an active game', () => {
        roomManagerServiceMock.rooms[0].players = [
            { socketId: socket.id, name: 'testName', points: 0, bonusCount: 0, canChat: true, hasSubmitted: false },
        ];
        roomManagerServiceMock.rooms[0].organizer.socketId = '';
        roomManagerServiceMock.rooms[0].answerTimes = [];
        const removePlayerSpy = jest.spyOn(roomManagerServiceMock, 'removePlayer');
        const deleteRoomSpy = jest.spyOn(roomManagerServiceMock, 'deleteRoom');

        server.to.returns({
            emit: (event: string, playerName: string) => {
                if (event === GameEvents.PlayerAbandonedGame) {
                    expect(event).toEqual(GameEvents.PlayerAbandonedGame);
                    expect(playerName).toEqual('testName');
                }
                if (event === GameEvents.AllPlayersSubmitted) {
                    expect(event).toEqual(GameEvents.AllPlayersSubmitted);
                }
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handlePlayerLeaveGame(socket, { roomId, isInGame: true });
        expect(server.to.calledWith(roomId)).toBeTruthy();
        expect(removePlayerSpy).toHaveBeenCalled();
        expect(deleteRoomSpy).toHaveBeenCalled();
        expect(roomManagerServiceMock.rooms.length).toBe(0);
        expect(socket.leave.calledOnceWith(roomId)).toBeTruthy();
        expect(socket.disconnect.calledOnce).toBeTruthy();
    });

    it('handlePlayerLeaveGame() should decrement submissionCount when a player who has submitted leaves the game', () => {
        roomManagerServiceMock.rooms[0].players = [
            { socketId: socket.id, name: 'testName', points: 0, bonusCount: 0, canChat: true, hasSubmitted: true },
        ];
        roomManagerServiceMock.rooms[0].submissionCount = 1;

        server.to.returns({
            emit: (event: string, playerName: string) => {
                if (event === GameEvents.PlayerAbandonedGame) {
                    expect(event).toEqual(GameEvents.PlayerAbandonedGame);
                    expect(playerName).toEqual('testName');
                }
                if (event === GameEvents.AllPlayersSubmitted) {
                    expect(event).toEqual(GameEvents.AllPlayersSubmitted);
                }
            },
        } as BroadcastOperator<unknown, unknown>);

        gateway.handlePlayerLeaveGame(socket, { roomId, isInGame: true });
        expect(roomManagerServiceMock.rooms[0].submissionCount).toBe(0);
    });

    it('handleGoodAnswer() should add the timestamp to answerTimes and emit GoodAnswer if timer is not finished', () => {
        const submission: PlayerSubmission = { roomId, hasSubmittedBeforeEnd: true };

        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.GoodAnswer);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleGoodAnswer(socket, submission);
        expect(roomManagerServiceMock.rooms[0].answerTimes.length).toBeGreaterThan(2);
        expect(roomManagerServiceMock.rooms[0].answerTimes[2].userId).toBe(socket.id);
        expect(roomManagerServiceMock.rooms[0].answerTimes[2].timeStamp).toBeDefined();
    });

    it('handleGoodAnswer() should add null to answerTimes and emit GoodAnswer when timer is finished', () => {
        const submission: PlayerSubmission = { roomId, hasSubmittedBeforeEnd: false };

        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.GoodAnswer);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleGoodAnswer(socket, submission);
        expect(roomManagerServiceMock.rooms[0].answerTimes.length).toBeGreaterThan(2);
        expect(roomManagerServiceMock.rooms[0].answerTimes[2].userId).toBe(socket.id);
        expect(roomManagerServiceMock.rooms[0].answerTimes[2].timeStamp).toBeDefined();
    });

    it('handleRemoveAnswerTime() should remove the timestamp from the list of answerTimes', () => {
        const userIdToRemove = 'playerId1';

        gateway.handleRemoveAnswerTime(socket, { roomId, userIdToRemove });
        expect(roomManagerServiceMock.rooms[0].answerTimes.length).toBe(2);
        expect(roomManagerServiceMock.rooms[0].answerTimes[0].userId).toBe('playerId2');
        expect(roomManagerServiceMock.rooms[0].answerTimes[1].userId).toBe(socket.id);
    });

    it('handleChoiceToggle() should emit to the organizer that a choice was selected', () => {
        const questionChoiceIndex = 1;

        server.to.returns({
            emit: (event: string, index: number) => {
                expect(event).toEqual(GameEvents.QuestionChoiceSelect);
                expect(index).toEqual(questionChoiceIndex);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleToggleChoice(socket, { roomId, questionChoiceIndex, isSelect: true });
        expect(server.to.calledWith(roomManagerServiceMock.rooms[0].organizer.socketId)).toBeTruthy();
    });

    it('handleToggleChoice() should emit to the organizer that a choice was unselected', () => {
        const questionChoiceIndex = 1;

        socket.join(roomId);
        server.to.returns({
            emit: (event: string, index: number) => {
                expect(event).toEqual(GameEvents.QuestionChoiceUnselect);
                expect(index).toEqual(questionChoiceIndex);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleToggleChoice(socket, { roomId, questionChoiceIndex, isSelect: false });
        expect(server.to.calledWith(roomManagerServiceMock.rooms[0].organizer.socketId)).toBeTruthy();
    });

    it('handleChoiceArrayUnselect() should emit the unselected choice indexes', () => {
        const questionChoiceIndexes = [1, 2];

        const emittedEvents = [];
        server.to.returns({
            emit: (event: string, index: number) => {
                emittedEvents.push({ event, index });
            },
        } as BroadcastOperator<unknown, unknown>);

        gateway.handleChoiceArrayUnselect(socket, { roomId, questionChoiceIndexes });
        expect(emittedEvents.length).toEqual(questionChoiceIndexes.length);

        questionChoiceIndexes.forEach((choiceIndex, i) => {
            expect(emittedEvents[i].event).toEqual(GameEvents.QuestionChoiceUnselect);
            expect(emittedEvents[i].index).toEqual(choiceIndex);
        });
    });

    it('handleSubmitAnswer() should emit to organizer when a question was submitted by player', () => {
        const submission: PlayerSubmission = { roomId, hasSubmittedBeforeEnd: true };

        roomManagerServiceMock.rooms[0].organizer.socketId = socket.id;
        const organizerId = roomManagerServiceMock.rooms[0].organizer.socketId;
        server.to.returns({
            emit: (event: string) => {
                if (event === GameEvents.SubmitAnswer) {
                    expect(event).toEqual(GameEvents.SubmitAnswer);
                }
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleSubmitAnswer(socket, submission);
        expect(server.to.calledWith(organizerId)).toBeTruthy();
    });

    it('handleSubmitAnswer() should push QRL answer to room and emit events correctly', () => {
        const submission: PlayerSubmission = { roomId, hasSubmittedBeforeEnd: true, answer: 'testAnswer', questionType: 'QRL' as QTypes };

        roomManagerServiceMock.rooms[0].organizer.socketId = socket.id;
        const organizerId = roomManagerServiceMock.rooms[0].organizer.socketId;
        roomManagerServiceMock.rooms[0].submissionCount = 1;

        const mockPlayer = { socketId: socket.id, name: 'name1', points: 50, bonusCount: 0, canChat: true, hasSubmitted: false };
        roomManagerServiceMock.rooms[0].players = [mockPlayer];

        stub(roomManagerServiceMock, 'findPlayer').callsFake((id, room) => {
            return room.players.find((player) => player.socketId === id);
        });

        server.to.returns({
            emit: (event: string, payload: PlayerSubmission | PlayerSubmission[]) => {
                if (event === GameEvents.SubmitAnswer) {
                    expect(event).toEqual(GameEvents.SubmitAnswer);
                    expect(payload).toEqual(submission);
                }
                if (event === GameEvents.AllPlayersSubmitted) {
                    expect(event).toEqual(GameEvents.AllPlayersSubmitted);
                    expect(payload).toEqual(roomManagerServiceMock.rooms[0].qrlAnswers);
                }
            },
        } as BroadcastOperator<unknown, unknown>);

        gateway.handleSubmitAnswer(socket, submission);
        expect(roomManagerServiceMock.rooms[0].qrlAnswers[0]).toEqual(submission);
        expect(server.to.calledWith(organizerId)).toBeTruthy();
    });

    it('handleSubmitAnswer() empty QRL answers if submitted count equals players length', () => {
        const submission: PlayerSubmission = { roomId, hasSubmittedBeforeEnd: true, answer: 'testAnswer', questionType: 'QRL' as QTypes };

        roomManagerServiceMock.rooms[0].organizer.socketId = socket.id;
        const organizerId = roomManagerServiceMock.rooms[0].organizer.socketId;
        roomManagerServiceMock.rooms[0].submissionCount = 0;
        const mockPlayers = roomManagerServiceMock.rooms[0].players;

        stub(roomManagerServiceMock, 'findPlayer').callsFake((id, room) => {
            return room.players.find((player) => player.socketId === id);
        });

        server.to.returns({
            emit: (event: string, payload: PlayerSubmission | PlayerSubmission[]) => {
                if (event === GameEvents.SubmitAnswer) {
                    expect(event).toEqual(GameEvents.SubmitAnswer);
                    expect(payload).toEqual(submission);
                }
                if (event === GameEvents.AllPlayersSubmitted) {
                    expect(event).toEqual(GameEvents.AllPlayersSubmitted);
                    expect(payload).toEqual(roomManagerServiceMock.rooms[0].qrlAnswers);
                }
            },
        } as BroadcastOperator<unknown, unknown>);

        mockPlayers.forEach((player) => {
            const playerSocket = { id: player.socketId } as unknown as Socket;
            gateway.handleSubmitAnswer(playerSocket, submission);
        });

        expect(roomManagerServiceMock.rooms[0].submissionCount).toEqual(mockPlayers.length);
        expect(roomManagerServiceMock.rooms[0].qrlAnswers).toEqual([]);
        expect(server.to.calledWith(organizerId)).toBeTruthy();
    });

    it('handleGiveBonus() should assign the bonus to player with fastest time when all times are different', () => {
        const getQuickestTimeSpy = jest.spyOn(roomManagerServiceMock, 'getQuickestTime');

        roomManagerServiceMock.rooms[0].answerTimes.push({ userId: socket.id, timeStamp: 1698849004046 });
        const fastestPlayer = roomManagerServiceMock.getQuickestTime(roomManagerServiceMock.findRoom(roomId));
        const fastestPlayerName = 'testName';
        const organizerId = roomManagerServiceMock.rooms[0].organizer.socketId;

        server.to.returns({
            emit: (event: string, playerName: string) => {
                if (event === GameEvents.BonusUpdate) {
                    expect(event).toEqual(GameEvents.BonusUpdate);
                    expect(playerName).toEqual(fastestPlayerName);
                }
                if (event === GameEvents.GiveBonus) {
                    expect(event).toEqual(GameEvents.GiveBonus);
                }
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleGiveBonus(socket, roomId);
        expect(server.to.calledWith(fastestPlayer.userId)).toBeTruthy();
        expect(server.to.calledWith(organizerId)).toBeTruthy();
        expect(getQuickestTimeSpy).toHaveBeenCalled();
        expect(getQuickestTimeSpy).toHaveReturnedWith(fastestPlayer);
        expect(roomManagerServiceMock.rooms[0].players[2].bonusCount).toBeGreaterThan(0);
        expect(server.to.calledWith(fastestPlayer.userId)).toBeTruthy();
        expect(server.to.calledWith(organizerId)).toBeTruthy();
    });

    it('handleGiveBonus() should not give the bonus if no player got the correct answer', () => {
        roomManagerServiceMock.rooms[0].answerTimes = [];
        const getQuickestTimeSpy = jest.spyOn(roomManagerServiceMock, 'getQuickestTime');

        socket.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.GiveBonus);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleGiveBonus(socket, roomId);
        expect(socket.to.called).toBeFalsy();
        expect(getQuickestTimeSpy).toHaveBeenCalled();
        expect(getQuickestTimeSpy).toHaveReturnedWith(null);
    });

    it('handleAddPointsToPlayer() should give points to the player if player answered the question correctly', () => {
        const room = roomManagerServiceMock.findRoom(roomId);
        const goodAnswerPoints = 100;
        const name = 'testName';
        const addPointsToPlayerSpy = jest.spyOn(roomManagerServiceMock, 'addPointsToPlayer');
        const pointsToAdd: PlayerPoints = { roomId, pointsToAdd: goodAnswerPoints };

        roomManagerServiceMock['addPlayerToRoom'](room, socket.id, name);

        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.AddPointsToPlayer);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleAddPointsToPlayer(socket, pointsToAdd);

        expect(server.to.calledWith(roomManagerServiceMock.rooms[0].organizer.socketId)).toBeTruthy();
        expect(addPointsToPlayerSpy).toHaveBeenCalledWith(socket.id, goodAnswerPoints, room);
        expect(roomManagerServiceMock.rooms[0].players[2].points).toEqual(goodAnswerPoints);
    });

    it('handleAddPointsToPlayer() should not add points to a player if room does not exist', () => {
        const addPointsToPlayerSpy = jest.spyOn(roomManagerServiceMock, 'addPointsToPlayer');
        const invalidRoomId = 'nonexistentRoomId';
        const pointsToAdd: PlayerPoints = { roomId: invalidRoomId, pointsToAdd: 10 };
        stub(socket, 'rooms').value(new Set([invalidRoomId]));

        gateway.handleAddPointsToPlayer(socket, pointsToAdd);
        expect(addPointsToPlayerSpy).not.toHaveBeenCalled();
        expect(server.to.withArgs(roomManagerServiceMock.rooms[0].organizer.socketId).called).toBeFalsy();
    });

    it('handleAddPointsToPlayer() should not add points to a player if the points for a given question are negative', () => {
        const addPointsToPlayerSpy = jest.spyOn(roomManagerServiceMock, 'addPointsToPlayer');
        const pointsToAdd: PlayerPoints = { roomId, pointsToAdd: -100 };

        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.AddPointsToPlayer);
            },
        } as BroadcastOperator<unknown, unknown>);

        gateway.handleAddPointsToPlayer(socket, pointsToAdd);
        expect(addPointsToPlayerSpy).not.toHaveBeenCalled();
        expect(server.to.called).toBeFalsy();
    });

    it('handleNextQuestion() should reset all players answersTimes when transitioning into a new question', () => {
        const room = roomManagerServiceMock.findRoom(roomId);
        const resetAnswerTimesSpy = jest.spyOn(roomManagerServiceMock, 'resetAnswerTimes');

        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.NextQuestion);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleNextQuestion(socket, roomId);

        expect(resetAnswerTimesSpy).toHaveBeenCalledWith(room);
        expect(roomManagerServiceMock.rooms[0].answerTimes.length).toEqual(0);
        expect(server.to.calledWith()).toBeTruthy();
    });

    it('handlePlayerLeaveGame() should remove, disconnect and emit PlayerAbandonedGame event if the game has started and the player has left', () => {
        const room = roomManagerServiceMock.findRoom(roomId);
        const name = 'testName';
        const removePlayerSpy = jest.spyOn(roomManagerServiceMock, 'removePlayer');
        socket.join(roomId);
        roomManagerServiceMock['addPlayerToRoom'](room, socket.id, name);

        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.PlayerAbandonedGame);
            },
        } as BroadcastOperator<unknown, unknown>);

        gateway.handlePlayerLeaveGame(socket, { roomId, isInGame: true });

        expect(removePlayerSpy).toHaveBeenCalledWith(room, socket.id);
        expect(socket.leave.calledOnceWith(roomId)).toBeTruthy();
        expect(socket.disconnect.called).toBeTruthy();
    });

    it('handleShowResults() should emit the game results to the specified room when game has ended', () => {
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.ShowResults);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleShowResults(socket, roomId);
        expect(server.to.calledWith(roomId)).toBeTruthy();
    });

    it('handleSendResults() should emit SendResults event to organizer when the game results are ready to be displayed', () => {
        roomManagerServiceMock.rooms[0].organizer.socketId = socket.id;
        const organizerId = roomManagerServiceMock.rooms[0].organizer.socketId;
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.SendResults);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleSendResults(socket, roomId);
        expect(server.to.calledWith(organizerId)).toBeTruthy();
    });

    it('handleEndGame() should not disconnect players if room does not exist', async () => {
        const nonExistentId = 'nonExistentRoomId';
        const nbRooms = roomManagerServiceMock.rooms.length;

        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.GameAborted);
            },
        } as BroadcastOperator<unknown, unknown>);
        await gateway.handleEndGame(socket, { roomId: nonExistentId, gameAborted: false });
        expect(server.to.called).toBeFalsy();
        expect(roomManagerServiceMock.rooms).toHaveLength(nbRooms);
    });

    it('handleEndGame() should delete the room if no players are left', async () => {
        const mockRoom = roomManagerServiceMock.rooms[0];
        mockRoom.players = [];
        const deleteRoomSpy = jest.spyOn(roomManagerServiceMock, 'deleteRoom');

        await gateway.handleEndGame(socket, { roomId, gameAborted: false });
        expect(deleteRoomSpy).toHaveBeenCalledWith(mockRoom);
        expect(roomManagerServiceMock.rooms).toHaveLength(0);
    });

    it('handleEndGame() should clear timer if game has been aborted', async () => {
        socket.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.GameAborted);
            },
        } as BroadcastOperator<unknown, unknown>);

        await gateway.handleEndGame(socket, { roomId, gameAborted: false });
        expect(socket.to.withArgs(roomId).called).toBeFalsy();
        expect(roomManagerServiceMock.rooms).toHaveLength(1);
    });

    it('handleEndGame() should handle all actions if game is aborted', async () => {
        const mockRoom = roomManagerServiceMock.rooms[0];
        mockRoom.timer = setInterval(() => {
            // empty
        }, Constants.ONE_SECOND_INTERVAL);

        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        socket.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.GameAborted);
            },
        } as BroadcastOperator<unknown, unknown>);

        const serverMock = {
            socketsLeave: jest.fn(),
            in: jest.fn().mockReturnThis(),
            disconnectSockets: jest.fn(),
        } as unknown as Server;

        gateway['server'] = serverMock;

        const deleteRoomSpy = jest.spyOn(roomManagerServiceMock, 'deleteRoom');

        await gateway.handleEndGame(socket, { roomId, gameAborted: true });

        expect(clearIntervalSpy).toHaveBeenCalledWith(mockRoom.timer);
        expect(serverMock.socketsLeave).toHaveBeenCalledWith(roomId);
        expect(serverMock.in).toHaveBeenCalledWith(roomId);
        expect(serverMock.disconnectSockets).toHaveBeenCalledWith(true);
        expect(deleteRoomSpy).toHaveBeenCalledWith(mockRoom);

        clearInterval(mockRoom.timer);
    });

    it('handleSaveChartData() should emit event to organizer on saveChartData event', () => {
        const organizerId = roomManagerServiceMock.rooms[0].organizer.socketId;

        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameEvents.SaveChartData);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleSaveChartData(socket, roomId);
        expect(server.to.calledWith(organizerId)).toBeTruthy();
    });

    it('handleFieldInteraction() should emit event to organizer when there is a field interaction', () => {
        const organizerId = roomManagerServiceMock.rooms[0].organizer.socketId;
        const testPlayer = roomManagerServiceMock.rooms[0].players.find((player) => player.socketId === socket.id);

        server.to.returns({
            emit: (event: string, playerName: string) => {
                expect(event).toEqual(GameEvents.FieldInteraction);
                expect(playerName).toEqual(testPlayer.name);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleFieldInteraction(socket, roomId);
        expect(server.to.calledWith(organizerId)).toBeTruthy();
    });

    it('handleQRLAnswerUpdate() should emit event to organizer when there is a QRL answer update and modify qrlUpdates', () => {
        const organizerId = roomManagerServiceMock.rooms[0].organizer.socketId;
        roomManagerServiceMock.rooms[0].players = [roomManagerServiceMock.rooms[0].players[0]];

        server.to.returns({
            emit: (event: string, hasModifiedText: boolean) => {
                expect(event).toEqual(GameEvents.QRLAnswerUpdate);
                expect(hasModifiedText).toEqual(true);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.handleQRLAnswerUpdate(socket, { roomId, hasModifiedText: true });
        expect(server.to.calledWith(organizerId)).toBeTruthy();
    });
});
