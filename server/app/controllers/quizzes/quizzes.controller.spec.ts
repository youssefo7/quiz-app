import { Quiz } from '@app/model/database/quiz';
import { QuizzesService } from '@app/services/quizzes/quizzes.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { QuizzesController } from './quizzes.controller';

describe('QuizzesController', () => {
    let controller: QuizzesController;
    let quizzesService: SinonStubbedInstance<QuizzesService>;

    beforeEach(async () => {
        quizzesService = createStubInstance(QuizzesService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [QuizzesController],
            providers: [
                {
                    provide: QuizzesService,
                    useValue: quizzesService,
                },
            ],
        }).compile();

        controller = module.get<QuizzesController>(QuizzesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('getQuizzes() should return all Quizzes', async () => {
        const fakeQuizzes = [new Quiz()];
        quizzesService.getQuizzes.resolves(fakeQuizzes);

        const res = {} as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (quizzes) => {
            expect(quizzes).toEqual(fakeQuizzes);
            return res;
        };

        await controller.getQuizzes(res);
    });

    it('getQuizzes() should return NOT_FOUND when service fails to fetch Quizzes', async () => {
        quizzesService.getQuizzes.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.getQuizzes(res);
    });

    it('getQuiz should return the Quiz', async () => {
        const fakeQuiz = new Quiz();
        quizzesService.getQuiz.resolves(fakeQuiz);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (quiz) => {
            expect(quiz).toEqual(fakeQuiz);
            return res;
        };

        await controller.getQuiz('id', res);
    });

    it('getQuiz should return NOT_FOUND when service fails to fetch the Quiz', async () => {
        quizzesService.getQuiz.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.getQuiz('id', res);
    });

    it('addQuiz() should return the added Quiz', async () => {
        const fakeQuiz = new Quiz();
        quizzesService.addQuiz.resolves(fakeQuiz);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.CREATED);
            return res;
        };
        res.json = (quiz) => {
            expect(quiz).toEqual(fakeQuiz);
            return res;
        };

        await controller.addQuiz(fakeQuiz, res);
    });

    it('addQuiz() should return BAD_REQUEST when service fails to add the Quiz', async () => {
        quizzesService.addQuiz.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.BAD_REQUEST);
            return res;
        };
        res.send = () => res;

        await controller.addQuiz(new Quiz(), res);
    });

    it('updateQuiz() should return the updated Quiz', async () => {
        const fakeQuiz = new Quiz();
        quizzesService.updateQuiz.resolves(fakeQuiz);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (quiz) => {
            expect(quiz).toEqual(fakeQuiz);
            return res;
        };

        await controller.updateQuiz('id', fakeQuiz, res);
    });

    it('updateQuiz() should return NOT_FOUND when cannot update the Quiz', async () => {
        quizzesService.updateQuiz.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.updateQuiz('id', new Quiz(), res);
    });

    it('deleteQuiz() should return OK', async () => {
        quizzesService.deleteQuiz.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;

        await controller.deleteQuiz('id', res);
    });

    it('deleteQuiz() should return NOT_FOUND when service cannot delete the Quiz', async () => {
        quizzesService.deleteQuiz.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.deleteQuiz('id', res);
    });
});
