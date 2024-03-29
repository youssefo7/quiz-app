// Raison: Tests unitaires du contrôleur nécessaires pour couvrir le code dépassent la limite de lignes
/* eslint-disable max-lines */
import { Quiz } from '@app/model/database/quiz';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { QuestionChartData } from '@common/question-chart-data';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { RoomController } from './room.controller';

describe('RoomController', () => {
    let controller: RoomController;
    let roomManagerService: SinonStubbedInstance<RoomManagerService>;

    beforeEach(async () => {
        roomManagerService = createStubInstance(RoomManagerService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RoomController],
            providers: [
                {
                    provide: RoomManagerService,
                    useValue: roomManagerService,
                },
            ],
        }).compile();

        controller = module.get<RoomController>(RoomController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('handleChooseName() should validate a given name and return name status', async () => {
        const roomId = 'roomId';
        const body = { name: 'TestName', socketId: 'socketId' };
        roomManagerService.processUsername.returns(true);

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual(true);
            return res;
        };

        controller.handleChooseName(roomId, body, res);
    });

    it('handleChooseName() should return INTERNAL_SERVER_ERROR when service fails to validate name', async () => {
        const roomId = 'roomId';
        const body = { name: 'TestName', socketId: 'socketId' };
        roomManagerService.processUsername.throws();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual('Erreur lors de la validation du nom');
            return res;
        };

        controller.handleChooseName(roomId, body, res);
    });

    it('handleJoinRoom() should validate and return room state', async () => {
        const roomId = 'roomId';
        const quiz = {} as Quiz;
        const body = { socketId: 'socketId' };
        const roomStateResponse = { roomState: 'OK', quiz };

        roomManagerService.processJoinRoom.returns(roomStateResponse);

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (roomState) => {
            expect(roomState).toEqual(roomStateResponse);
            return res;
        };

        controller.handleJoinRoom(roomId, body, res);
    });

    it('handleJoinRoom() should return INTERNAL_SERVER_ERROR when service fails to process join room', async () => {
        const roomId = 'roomId';
        const body = { socketId: 'socketId' };
        roomManagerService.processJoinRoom.throws();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual('Erreur lors de la validation de la salle');
            return res;
        };

        controller.handleJoinRoom(roomId, body, res);
    });

    it('handleCreateRoom() should create a room with a unique id and return its id', async () => {
        const body = { quiz: { id: 'mockedId' } as Quiz, socketId: 'socketId' };
        roomManagerService.createNewRoom.returns('roomId');

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (newRoomResponse) => {
            expect(newRoomResponse).toEqual({ roomId: 'roomId' });
            return res;
        };

        controller.handleCreateRoom(body, res);
    });

    it('handleCreateRoom() should return INTERNAL_SERVER_ERROR when service fails to create a room', async () => {
        const body = { quiz: { id: 'mockedId' } as Quiz, socketId: 'socketId' };
        roomManagerService.createNewRoom.throws();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual('Erreur lors de la création de la salle');
            return res;
        };

        controller.handleCreateRoom(body, res);
    });

    it('handleGetPlayers() should return player names in room', async () => {
        const roomId = 'roomId';
        roomManagerService.getRoomPlayers.returns(['player1', 'player2']);

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = (players) => {
            expect(players).toEqual(['player1', 'player2']);
            return res;
        };

        controller.handleGetPlayers(roomId, res);
    });

    it('handleGetPlayers() should return NOT_FOUND when service fails to get players', async () => {
        const roomId = 'roomId';
        roomManagerService.getRoomPlayers.throws();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual('Erreur lors de la récupération des joueurs de la salle roomId');
            return res;
        };

        controller.handleGetPlayers(roomId, res);
    });

    it('handleGetName() should return a valid player name in a given room', async () => {
        const roomId = 'roomId';
        const body = { socketId: 'socketId' };
        roomManagerService.getPlayerName.returns('playerName');

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (name) => {
            expect(name).toEqual('playerName');
            return res;
        };

        controller.handleGetName(roomId, body, res);
    });

    it('handleGetName() should return NOT_FOUND when service fails to get player name', async () => {
        const roomId = 'roomId';
        const body = { socketId: 'socketId' };
        roomManagerService.getPlayerName.throws();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual('Erreur lors de la récupération du nom du joueur socketId de la salle roomId');
            return res;
        };

        controller.handleGetName(roomId, body, res);
    });

    it('handleGetRoomQuiz() should return the quiz of the game in a given room', async () => {
        const roomId = 'roomId';
        roomManagerService.getRoomQuiz.returns({ id: 'quizId' } as Quiz);

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (quiz) => {
            expect(quiz).toEqual({ id: 'quizId' });
            return res;
        };

        controller.handleGetRoomQuiz(roomId, res);
    });

    it('handleGetRoomQuiz() should return NOT_FOUND when service fails to get the quiz of a given room', async () => {
        const roomId = 'roomId';
        roomManagerService.getRoomQuiz.throws();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual('Erreur lors de la récupération du quiz de la salle roomId');
            return res;
        };

        controller.handleGetRoomQuiz(roomId, res);
    });

    it('handleGetResults() should return player results in room', async () => {
        const roomId = 'roomId';
        const roomResults = [
            {
                name: 'playerName',
                points: 2,
                hasAbandoned: true,
                hasClickedOnAsnwerField: false,
                hasConfirmedAnswer: false,
                hasClickedOnAnswerField: false,
                bonusCount: 1,
            },
        ];
        roomManagerService.getResults.returns(roomResults);

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (results) => {
            expect(results).toEqual(roomResults);
            return res;
        };

        controller.handleGetResults(roomId, res);
    });

    it('handleGetResults() should return NOT_FOUND when service fails to get player results', async () => {
        const roomId = 'roomId';
        roomManagerService.getResults.throws();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual('Erreur lors de la récupération des résultats de la salle roomId');
            return res;
        };

        controller.handleGetResults(roomId, res);
    });

    it('handleSendResults() should return posted player results in room', async () => {
        const roomId = 'roomId';
        const body = [
            {
                name: 'playerName',
                points: 2,
                hasAbandoned: true,
                hasClickedOnAsnwerField: false,
                hasConfirmedAnswer: false,
                hasClickedOnAnswerField: false,
                bonusCount: 1,
            },
        ];
        roomManagerService.postResults.returns();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (results) => {
            expect(results).toEqual(body);
            return res;
        };

        controller.handleSendResults(roomId, body, res);
    });

    it('handleSendResults() should return INTERNAL_SERVER_ERROR when service fails to post player results', async () => {
        const roomId = 'roomId';
        const body = [
            {
                name: 'playerName',
                points: 2,
                hasAbandoned: true,
                hasClickedOnAsnwerField: false,
                hasConfirmedAnswer: false,
                hasClickedOnAnswerField: false,
                bonusCount: 1,
            },
        ];
        roomManagerService.postResults.throws();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual("Erreur lors de l'envoi des résultats de la salle roomId");
            return res;
        };

        controller.handleSendResults(roomId, body, res);
    });

    it('handleGetChatMessages() should return chat messages in room', async () => {
        const roomId = 'roomId';
        const chatMessages = [{ authorName: 'playerName', time: 'time', message: 'message', fromSystem: false }];
        roomManagerService.getChatMessages.returns(chatMessages);

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (messages) => {
            expect(messages).toEqual(chatMessages);
            return res;
        };

        controller.handleGetMessages(roomId, res);
    });

    it('handleGetChatMessages() should return NOT_FOUND when service fails to get chat messages', async () => {
        const roomId = 'roomId';
        roomManagerService.getChatMessages.throws();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual('Erreur lors de la récupération des messages de la salle roomId');
            return res;
        };

        controller.handleGetMessages(roomId, res);
    });

    it('handleSendMessages() should return chat messages in room', async () => {
        const roomId = 'roomId';
        const body = [{ authorName: 'playerName', time: 'time', message: 'message', fromSystem: false }];
        roomManagerService.postChatMessages.returns();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (messages) => {
            expect(messages).toEqual(body);
            return res;
        };

        controller.handleSendMessages(roomId, body, res);
    });

    it('handleSendMessages() should return INTERNAL_SERVER_ERROR when service fails to post chat messages', async () => {
        const roomId = 'roomId';
        const body = [{ authorName: 'playerName', time: 'time', message: 'message', fromSystem: false }];
        roomManagerService.postChatMessages.throws();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual("Erreur lors de l'envoi des messages de la salle roomId");
            return res;
        };

        controller.handleSendMessages(roomId, body, res);
    });

    it('handleGetQuestionsChartData() should return questions chart data in room', async () => {
        const roomId = 'roomId';
        const questionsChartData: QuestionChartData[] = [{ playersChoices: ['1', '2'], interactionsCount: [1, 2] }];
        roomManagerService.getQuestionsChartData.returns(questionsChartData);

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (data) => {
            expect(data).toEqual(questionsChartData);
            return res;
        };

        controller.handleGetQuestionsChartData(roomId, res);
    });

    it('handleGetQuestionsChartData() should return NOT_FOUND when service fails to get questions chart data', async () => {
        const roomId = 'roomId';
        roomManagerService.getQuestionsChartData.throws();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual('Erreur lors de la récupération des statistiques de la partie de la salle roomId');
            return res;
        };

        controller.handleGetQuestionsChartData(roomId, res);
    });

    it('handleSendChartData() should return posted questions chart data in room', async () => {
        const roomId = 'roomId';
        const questionsChartData: QuestionChartData[] = [{ playersChoices: ['1', '2'], interactionsCount: [1, 2] }];
        roomManagerService.postQuestionsChartData.returns();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.CREATED);
            return res;
        };
        res.json = (data) => {
            expect(data).toEqual(questionsChartData);
            return res;
        };

        controller.handleSendChartData(roomId, questionsChartData, res);
    });

    it('handleSendChartData() should return INTERNAL_SERVER_ERROR when service fails to post questions chart data', async () => {
        const roomId = 'roomId';
        const questionsChartData: QuestionChartData[] = [{ playersChoices: ['1', '2'], interactionsCount: [1, 2] }];
        roomManagerService.postQuestionsChartData.throws();

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual('Erreur lors de la sauvegarde des statistiques de la partie de la salle roomId');
            return res;
        };

        controller.handleSendChartData(roomId, questionsChartData, res);
    });
});
