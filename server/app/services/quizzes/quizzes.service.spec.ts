import { ChoiceType, QuestionType, Quiz, QuizDocument } from '@app/model/database/quiz';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { QuizzesService } from './quizzes.service';

describe('QuizzesService', () => {
    let service: QuizzesService;
    let quizModel: Model<QuizDocument>;
    const mockQuizzes: Quiz[] = [
        {
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

    beforeEach(() => {
        quizModel = {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findOneAndDelete: jest.fn(),
            findById: jest.fn(),
            insertMany: jest.fn(),
            countDocuments: jest.fn(),
            create: jest.fn(),
            exists: jest.fn(),
        } as unknown as Model<QuizDocument>;
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuizzesService,
                Logger,
                {
                    provide: getModelToken(Quiz.name),
                    useValue: quizModel,
                },
            ],
        }).compile();

        service = module.get<QuizzesService>(QuizzesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should populate DB if no documents exist', async () => {
        jest.spyOn(quizModel, 'countDocuments').mockResolvedValue(0);
        const populateDBSpy = jest.spyOn(service, 'populateDB').mockImplementation(async () => Promise.resolve());
        await service.start();
        expect(populateDBSpy).toHaveBeenCalled();
    });

    it('should insert quizzes and log message when populating DB', async () => {
        const insertManySpy = jest.spyOn(quizModel, 'insertMany').mockResolvedValue([]);
        const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();
        await service.populateDB();
        expect(insertManySpy).toHaveBeenCalledWith([]);
        expect(logSpy).toHaveBeenCalledWith('DB populated');
    });

    it('should get quizzes', async () => {
        const result = mockQuizzes;
        jest.spyOn(quizModel, 'find').mockResolvedValue(result);
        expect(await service.getQuizzes()).toEqual(result);
    });

    it('should get a Quiz by id', async () => {
        const result = mockQuizzes[0];
        jest.spyOn(quizModel, 'findOne').mockResolvedValue(result);
        expect(await service.getQuiz('1')).toEqual(result);
    });

    it('should send error if id does not exist when getting Quiz', async () => {
        jest.spyOn(quizModel, 'findOne').mockResolvedValue(null);
        await expect(service.getQuiz('3')).rejects.toEqual(new Error('Quiz 3 not found'));
    });

    it('should add a Quiz', async () => {
        const createdId = 'createdId';
        const dateModificationSpy = jest.spyOn(Date.prototype, 'toISOString');

        const newQuiz: Quiz = {
            ...mockQuizzes[0],
        };
        const createdQuiz = {
            ...mockQuizzes[0],
            _id: createdId,
        };
        (quizModel.create as jest.Mock).mockResolvedValueOnce({
            ...createdQuiz,
            save: jest.fn().mockResolvedValueOnce(createdQuiz),
        });

        const addedQuiz = await service.addQuiz(newQuiz);
        expect(dateModificationSpy).toHaveBeenCalled();
        expect(quizModel.create).toHaveBeenCalledWith(newQuiz);
        expect(addedQuiz.id).toEqual(createdId);
        dateModificationSpy.mockRestore();
    });

    it('should update a Quiz', async () => {
        const newDuration = 60;
        const updatedQuiz = { ...mockQuizzes[0], duration: newDuration };
        const dateModificationSpy = jest.spyOn(Date.prototype, 'toISOString');
        jest.spyOn(quizModel, 'findOneAndUpdate').mockResolvedValue(updatedQuiz);
        const result = await service.updateQuiz('1', updatedQuiz);
        expect(result).toEqual(updatedQuiz);
        expect(dateModificationSpy).toHaveBeenCalled();
        dateModificationSpy.mockRestore();
    });

    it('should send error if id does not exist when updating', async () => {
        jest.spyOn(quizModel, 'findOneAndUpdate').mockResolvedValue(null);
        await expect(service.updateQuiz('nonexistentId', mockQuizzes[0])).rejects.toEqual(new Error('Quiz nonexistentId not found'));
    });

    it('should delete a Quiz', async () => {
        const quizToDelete = mockQuizzes[0];
        jest.spyOn(quizModel, 'findOneAndDelete').mockResolvedValue(quizToDelete);
        await expect(service.deleteQuiz('1')).resolves.not.toThrow();
    });

    it('should throw error if id does not exist when deleting', async () => {
        jest.spyOn(quizModel, 'findOneAndDelete').mockResolvedValue(null);
        await expect(service.deleteQuiz('nonexistentId')).rejects.toEqual(new Error('Quiz nonexistentId not found'));
    });

    it('should verify a valid quiz successfully', async () => {
        const quiz = { ...mockQuizzes[0], title: 'new title' };
        await expect(service.verifyQuiz(quiz)).resolves.toBeUndefined();
    });

    it('should check quiz availability correctly', async () => {
        jest.spyOn(service.quizModel, 'findOne').mockResolvedValue(true);
        const result = await service.checkQuizAvailability('validId');
        expect(result).toBe(true);
    });

    it('should send error if checkQuizAvailability fails', async () => {
        jest.spyOn(service.quizModel, 'findOne').mockRejectedValue(new Error('error'));
        await expect(service.checkQuizAvailability('invalidId')).rejects.toThrow('error');
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

    it('should check for a non boolean isCorrect property', () => {
        const errors = [];
        const mockChoice = {
            text: 'test',
            isCorrect: 'string' as unknown as boolean,
        } as ChoiceType;

        service.verifyChoices([mockChoice], 0, errors);
        expect(mockChoice.isCorrect).toBe(false);
    });

    it('should set isCorrect to false when it is null', () => {
        const errors = [];
        const mockChoice = {
            text: 'test',
            isCorrect: null,
        } as ChoiceType;
        service.verifyChoices([mockChoice], 0, errors);
        expect(mockChoice.isCorrect).toBe(false);
    });

    it('should set isCorrect to false when it is undefined', () => {
        const errors = [];
        const mockChoice = {
            text: 'test',
            isCorrect: undefined,
        } as ChoiceType;
        service.verifyChoices([mockChoice], 0, errors);
        expect(mockChoice.isCorrect).toBe(false);
    });
});
