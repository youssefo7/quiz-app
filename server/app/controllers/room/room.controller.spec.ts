import { Quiz } from '@app/model/database/quiz';
import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { RoomController } from './room.controller';

describe('RoomController', () => {
    let controller: RoomController;
    let roomManagerService: SinonStubbedInstance<RoomManagerService>;
    let mockQuiz: Quiz;

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

    it('handleChooseName() should validate and return name status', async () => {
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

    // it('handleJoinRoom() should process and return room state', async () => {
    //     const roomId = 'roomId';
    //     const body = { socketId: 'socketId' };
    //     roomManagerService.processJoinRoom.returns({ roomState: 'OK', quiz: mockQuiz });

    //     const res = {} as Response;
    //     res.status = (code) => {
    //         expect(code).toEqual(HttpStatus.OK);
    //         return res;
    //     };
    //     res.json = (quizzes) => {
    //         expect(quizzes).toEqual({ roomState: 'OK', quizId: 'quizId' });
    //         return res;
    //     };

    //     controller.handleJoinRoom(roomId, body, res);
    // });

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

    it('handleCreateRoom() should create a room and return its id', async () => {
        const body = { quiz: mockQuiz, socketId: 'socketId' };
        roomManagerService.createNewRoom.returns('roomId');

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = (roomId) => {
            expect(roomId).toEqual('roomId');
            return res;
        };

        controller.handleCreateRoom(body, res);
    });

    it('handleCreateRoom() should return INTERNAL_SERVER_ERROR when service fails to create a room', async () => {
        const body = { quiz: mockQuiz, socketId: 'socketId' };
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

    // it('handleGetPlayers() should return player names in room', async () => {
    //     const roomId = 'roomId';
    //     roomManagerService.getRoomPlayers.returns(['player1', 'player2']);

    //     const res = {} as Response;
    //     res.status = (code) => {
    //         expect(code).toEqual(HttpStatus.OK);
    //         return res;
    //     };
    //     res.json = (players) => {
    //         expect(players).toEqual(['player1', 'player2']);
    //         return res;
    //     };

    //     controller.handleGetPlayers(roomId, res);
    // });

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

    it('handleGetName() should return player name in room', async () => {
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

    it('handleGetRoomQuiz() should return room quiz', async () => {
        const roomId = 'roomId';
        roomManagerService.getRoomQuiz.returns(mockQuiz);

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (quiz) => {
            expect(quiz).toEqual(quiz);
            return res;
        };

        controller.handleGetRoomQuiz(roomId, res);
    });

    it('handleGetRoomQuiz() should return NOT_FOUND when service fails to get room quiz', async () => {
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
});
