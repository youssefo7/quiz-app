import { Quiz } from '@app/model/database/quiz';
import { Test, TestingModule } from '@nestjs/testing';
import { promises as fs } from 'fs';
import { QuizzesService } from './quizzes.service';

// TODO tests for quiz validation and availability
describe('QuizzesService', () => {
    let service: QuizzesService;
    let mockQuizzes: Quiz[];
    const defaultMockQuizzes: Quiz[] = [
        {
            $schema: 'quiz-schema.json',
            id: '1',
            title: 'Questionnaire sur le JS',
            duration: 60,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: true,
            description: '',
            questions: [
                {
                    type: 'QCM',
                    text: 'Parmi les mots suivants, lesquels sont des mots clés réservés en JS?',
                    points: 40,
                    choices: [
                        {
                            text: 'var',
                            isCorrect: true,
                        },
                        {
                            text: 'self',
                            isCorrect: false,
                        },
                        {
                            text: 'this',
                            isCorrect: true,
                        },
                        {
                            text: 'int',
                            isCorrect: false,
                        },
                    ],
                },
            ],
        },
    ];

    const mockFilePath = 'mockFilePath.json';

    beforeEach(async () => {
        mockQuizzes = JSON.parse(JSON.stringify(defaultMockQuizzes));
        const module: TestingModule = await Test.createTestingModule({
            providers: [QuizzesService],
        }).compile();

        service = module.get<QuizzesService>(QuizzesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should get Quizzes', async () => {
        jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockQuizzes));
        jest.spyOn(service, 'quizzesPath', 'get').mockReturnValue(mockFilePath);
        const quizzes = await service.getQuizzes();
        expect(quizzes).toEqual(mockQuizzes);
    });

    it('should get a Quiz by id', async () => {
        jest.spyOn(service, 'getQuizzes').mockResolvedValue(mockQuizzes);
        const quiz = await service.getQuiz('1');
        expect(quiz).toEqual(mockQuizzes[0]);
    });

    it('should send error if id does not exist when getting Quiz', async () => {
        jest.spyOn(service, 'getQuizzes').mockResolvedValue(mockQuizzes);
        await expect(service.getQuiz('3')).rejects.toEqual(new Error('Quiz 3 not found'));
    });

    it('should add a Quiz', async () => {
        const newQuiz = { ...mockQuizzes[0], id: '2' };
        jest.spyOn(service, 'getQuizzes').mockResolvedValue(mockQuizzes);
        jest.spyOn(fs, 'writeFile').mockResolvedValue();
        await expect(service.addQuiz(newQuiz)).resolves.toEqual(newQuiz);
        expect(mockQuizzes.length).toBe(2);
        expect(mockQuizzes[1]).toEqual(newQuiz);
    });

    it('should update a Quiz', async () => {
        const newDuration = 120;
        const updatedQuiz = mockQuizzes[0];
        updatedQuiz.duration = newDuration;
        jest.spyOn(service, 'getQuizzes').mockResolvedValue(mockQuizzes);
        jest.spyOn(fs, 'writeFile').mockResolvedValue();
        await expect(service.updateQuiz('1', updatedQuiz)).resolves.toEqual(updatedQuiz);
        expect(mockQuizzes[0]).toEqual(updatedQuiz);
    });

    it('should send error if id does not exist when updating', async () => {
        jest.spyOn(service, 'getQuizzes').mockResolvedValue(mockQuizzes);
        jest.spyOn(fs, 'writeFile').mockResolvedValue();
        await expect(service.updateQuiz('2', mockQuizzes[0])).rejects.toEqual(new Error('Quiz 2 not found'));
    });

    it('should delete a Quiz and return [] if one object left', async () => {
        jest.spyOn(service, 'getQuizzes').mockResolvedValue(mockQuizzes);
        jest.spyOn(fs, 'writeFile').mockResolvedValue();
        expect(await service.deleteQuiz('1')).toEqual([]);
    });

    it('should delete a Quiz', async () => {
        const newMockQuizzes = JSON.parse(JSON.stringify(defaultMockQuizzes));
        jest.spyOn(service, 'getQuizzes').mockResolvedValue(newMockQuizzes);
        jest.spyOn(fs, 'writeFile').mockResolvedValue();
        newMockQuizzes.push({ ...mockQuizzes[0], id: '2' });
        expect(await service.deleteQuiz('2')).toEqual(mockQuizzes);
    });

    it('should throw error if id does not exist when deleting', async () => {
        jest.spyOn(service, 'getQuizzes').mockResolvedValue(mockQuizzes);
        try {
            await service.deleteQuiz('3');
        } catch (error) {
            expect(error.message).toBe('Quiz 3 not found');
        }
    });
});
