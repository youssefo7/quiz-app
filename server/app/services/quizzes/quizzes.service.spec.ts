import { ChoiceType, QuestionType, Quiz } from '@app/model/database/quiz';
import { Constants } from '@common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { promises as fs } from 'fs';
import { QuizzesService } from './quizzes.service';

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
            description: 'description',
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

        jest.spyOn(service, 'getQuizzes').mockResolvedValue(mockQuizzes);
        jest.spyOn(fs, 'writeFile').mockResolvedValue();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should get Quizzes', async () => {
        jest.restoreAllMocks();
        jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockQuizzes));
        jest.spyOn(service, 'quizzesPath', 'get').mockReturnValue(mockFilePath);
        const quizzes = await service.getQuizzes();
        expect(quizzes).toEqual(mockQuizzes);
    });

    it('should send error if getQuizzes fails', async () => {
        jest.restoreAllMocks();
        jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('Failed to get Quizzes'));
        jest.spyOn(service, 'quizzesPath', 'get').mockReturnValue(mockFilePath);
        await expect(service.getQuizzes()).rejects.toEqual(new Error('Failed to get Quizzes'));
    });

    it('should get a Quiz by id', async () => {
        const quiz = await service.getQuiz('1');
        expect(quiz).toEqual(mockQuizzes[0]);
    });

    it('should send error if id does not exist when getting Quiz', async () => {
        await expect(service.getQuiz('3')).rejects.toEqual(new Error('Quiz 3 not found'));
    });

    it('should add a Quiz', async () => {
        const newQuiz = { ...mockQuizzes[0], id: '2' };
        await expect(service.addQuiz(newQuiz)).resolves.toEqual(newQuiz);
        expect(mockQuizzes.length).toBe(2);
        expect(mockQuizzes[1]).toEqual(newQuiz);
    });

    it('should send error if adding quiz fails', async () => {
        const newQuiz = { ...mockQuizzes[0], id: '2' };
        jest.spyOn(service, 'getQuizzes').mockRejectedValue(new Error('Failed to get Quizzes'));
        await expect(service.addQuiz(newQuiz)).rejects.toEqual(new Error('Failed to get Quizzes'));
    });

    it('should update a Quiz', async () => {
        const newDuration = 120;
        const updatedQuiz = mockQuizzes[0];
        updatedQuiz.duration = newDuration;
        await expect(service.updateQuiz('1', updatedQuiz)).resolves.toEqual(updatedQuiz);
        expect(mockQuizzes[0]).toEqual(updatedQuiz);
    });

    it('should send error if id does not exist when updating', async () => {
        await expect(service.updateQuiz('2', mockQuizzes[0])).rejects.toEqual(new Error('Quiz 2 not found'));
    });

    it('should delete a Quiz and return [] if one object left', async () => {
        expect(await service.deleteQuiz('1')).toEqual([]);
    });

    it('should delete a Quiz', async () => {
        const newMockQuizzes = JSON.parse(JSON.stringify(defaultMockQuizzes));
        jest.spyOn(service, 'getQuizzes').mockResolvedValue(newMockQuizzes);
        newMockQuizzes.push({ ...mockQuizzes[0], id: '2' });
        expect(await service.deleteQuiz('2')).toEqual(mockQuizzes);
    });

    it('should throw error if id does not exist when deleting', async () => {
        try {
            await service.deleteQuiz('3');
        } catch (error) {
            expect(error.message).toBe('Quiz 3 not found');
        }
    });

    it('should throw error if delete fails', async () => {
        jest.spyOn(service, 'getQuizzes').mockRejectedValue(new Error('test'));
        try {
            await service.deleteQuiz('testID123');
        } catch (error) {
            expect(error.message).toBe('test');
        }
    });

    it('should verify a valid quiz successfully', async () => {
        const quiz = { ...mockQuizzes[0], title: 'new title' };
        await expect(service.verifyQuiz(quiz)).resolves.toBeUndefined();
    });

    it('should create a new 6-character-long ID correctly', async () => {
        expect(await service.createID()).toHaveLength(Constants.RANDOM_STRING_LENGTH);
    });

    it('should create unique IDs', async () => {
        jest.spyOn(service, 'checkIdAvailability').mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        const id = await service.createID();
        expect(service.checkIdAvailability).toHaveBeenCalledTimes(2);
        expect(id).toBeDefined();
    });

    it('should check quiz availability correctly', async () => {
        jest.spyOn(service, 'checkIdAvailability').mockResolvedValue(false);
        expect(await service.checkQuizAvailability('1')).toBe(true);
    });

    it('should send error if checkQuizAvailability fails', async () => {
        jest.spyOn(service, 'checkIdAvailability').mockRejectedValue(new Error('Failed to check quiz availability'));
        await expect(service.checkQuizAvailability('1')).rejects.toThrow('Failed to check quiz availability');
    });

    it('should import a quiz successfully', async () => {
        const quiz = { ...mockQuizzes[0], title: 'new title' };
        jest.spyOn(service, 'addQuiz').mockResolvedValue(quiz);
        expect(await service.importQuiz(quiz)).toEqual(quiz);
    });

    it('should send error when importing an invalid quiz', async () => {
        const quiz = { ...mockQuizzes[0], title: '' };
        jest.spyOn(service, 'addQuiz').mockResolvedValue(quiz);
        await expect(service.importQuiz(quiz)).rejects.toThrow('Titre du quiz invalide ou manquant');
    });

    it('should check if quiz is visible', async () => {
        const mockQuiz = { ...mockQuizzes[0], visibility: true };
        jest.spyOn(service, 'getQuiz').mockResolvedValue(mockQuiz);
        const isVisible = await service.checkQuizVisibility(mockQuiz.id);
        expect(isVisible).toBe(true);
    });

    it('should check if quiz is not visible', async () => {
        const mockQuiz = { ...mockQuizzes[0], visibility: false };
        jest.spyOn(service, 'getQuiz').mockResolvedValue(mockQuiz);
        const isVisible = await service.checkQuizVisibility(mockQuiz.id);
        expect(isVisible).toBe(false);
    });

    it('should send an error if the quiz does not exist when checking visibility', async () => {
        jest.spyOn(service, 'getQuiz').mockRejectedValue(new Error('Quiz not found'));
        await expect(service.checkQuizVisibility('badID')).rejects.toThrow('Quiz not found');
    });

    it('should check for an already existing title', async () => {
        jest.spyOn(service, 'checkTitleExists').mockResolvedValue(true);

        const mockQuiz = {
            title: 'test',
        } as Quiz;

        await expect(service.verifyQuiz(mockQuiz)).rejects.toThrow('Titre du quiz déjà utilisé');
    });

    it('should check for a missing or invalid title', async () => {
        const mockQuiz = {} as Quiz;

        await expect(service.verifyQuiz(mockQuiz)).rejects.toThrow('Titre du quiz invalide ou manquant');
    });

    it('should check for a missing or invalid duration', async () => {
        const mockQuiz = {
            title: 'test',
            duration: 'string',
        } as unknown as Quiz;

        await expect(service.verifyQuiz(mockQuiz)).rejects.toThrow('La durée du quiz est manquante ou doit être un nombre');
    });

    it('should check for a missing or invalid description', async () => {
        const mockQuiz = {
            title: 'test',
        } as unknown as Quiz;

        await expect(service.verifyQuiz(mockQuiz)).rejects.toThrow('Description du quiz invalide ou manquante');
    });

    it('should check for a wrong duration', async () => {
        const mockQuiz = {
            title: 'test',
            duration: 70,
        } as Quiz;

        await expect(service.verifyQuiz(mockQuiz)).rejects.toThrow('La durée du quiz doit être entre 10 et 60 secondes');
    });

    it('should check for invalid questions', async () => {
        const mockQuiz = {
            title: 'test',
            duration: 30,
            questions: [],
        } as Quiz;

        await expect(service.verifyQuiz(mockQuiz)).rejects.toThrow('Les questions sont manquantes ou vides');
    });

    it('should check for an invalid question type', () => {
        const errors = [];
        const mockQuestion = {
            type: 'QC',
        } as QuestionType;

        service.verifyQuestion(mockQuestion, 0, errors);
        expect(errors).toContain("Type de la question 1 invalide ou manquant ('QCM' ou 'QRL'))");
    });

    it('should check for a missing or invalid question text', () => {
        const errors = [];
        const mockQuestion = {
            type: 'QCM',
        } as QuestionType;

        service.verifyQuestion(mockQuestion, 0, errors);
        expect(errors).toContain('Texte de la question 1 est invalide ou manquant');
    });

    it('should check for a missing or invalid choice text', () => {
        const errors = [];
        const mockChoice = {
            isCorrect: true,
        } as ChoiceType;

        service.verifyChoices([mockChoice], 0, errors);
        expect(errors).toContain('Texte du choix 1 de la question 1 invalide ou manquant');
    });

    it('should check for a missing or invalid isCorrect property', () => {
        const errors = [];
        const mockChoice = {
            text: 'test',
        } as ChoiceType;

        service.verifyChoices([mockChoice], 0, errors);
        expect(errors).toContain('La propriété "isCorrect" du choix 1 de la question 1 est invalide ou manquante');
    });

    it('should throw error if there is a write failure', async () => {
        jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('test'));
        await expect(service.saveQuizzes(mockQuizzes)).rejects.toThrow('Error saving quizzes: test');
    });
});
