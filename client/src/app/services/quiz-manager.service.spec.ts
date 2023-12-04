/* Raison : on n'a besoin de beaucoup de lignes pour set le formulaire
dans le bon état initial dépendamment du test */
/* eslint-disable max-lines */
// any est nécessaire pour espionner les méthodes privées
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Choice, Question, Quiz } from '@app/interfaces/quiz';
import { of, throwError } from 'rxjs';
import { QuizCommunicationService } from './quiz-communication.service';
import { QuizManagerService } from './quiz-manager.service';
import SpyObj = jasmine.SpyObj;

describe('QuizManagerService', () => {
    let service: QuizManagerService;
    let quizCommunicationServiceSpy: SpyObj<QuizCommunicationService>;
    let routerSpy: SpyObj<Router>;
    let quizToEditMock: Quiz;
    const newQuestion: Question = {
        type: 'QCM',
        text: 'Q2',
        points: 10,
        choices: [
            { text: 'c1', isCorrect: true },
            { text: 'c2', isCorrect: false },
        ],
    };
    const quizListMock: Quiz[] = [
        {
            id: '01',
            title: 'Quiz1',
            description: 'first quiz of the list',
            duration: 60,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: true,
            questions: [
                {
                    type: 'QCM',
                    text: 'Q1',
                    points: 40,
                    choices: [
                        { text: 'c1', isCorrect: true },
                        { text: 'c2', isCorrect: false },
                    ],
                },
            ],
        },
        {
            id: '02',
            title: 'Quiz2',
            description: 'second quiz of the list',
            duration: 60,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: false,
            questions: [
                {
                    type: 'QCM',
                    text: 'Q1',
                    points: 40,
                    choices: [
                        { text: 'c1', isCorrect: true },
                        { text: 'c2', isCorrect: false },
                    ],
                },
            ],
        },
    ];
    beforeEach(() => {
        quizCommunicationServiceSpy = jasmine.createSpyObj(QuizCommunicationService, ['getQuizzes', 'addQuiz', 'updateQuiz', 'getQuiz']);
        quizCommunicationServiceSpy.getQuizzes.and.returnValue(of([]));
        routerSpy = jasmine.createSpyObj(Router, ['navigateByUrl']);
    });
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: QuizCommunicationService, useValue: quizCommunicationServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
    });
    beforeEach(() => {
        service = TestBed.inject(QuizManagerService);
        quizToEditMock = {
            id: '1',
            title: 'test',
            description: 'dummy description',
            duration: 60,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: true,
            questions: [
                {
                    type: 'QCM',
                    text: 'Q1',
                    points: 40,
                    choices: [
                        { text: 'c1', isCorrect: true },
                        { text: 'c2', isCorrect: false },
                    ],
                },
            ],
        };
        service.quizToModify = quizToEditMock;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch quizzes', () => {
        quizCommunicationServiceSpy.getQuizzes.and.returnValue(of(quizListMock));
        service.getQuizListFromServer();
        expect(service.quizzes).toEqual(quizListMock);
    });

    it('should redirect to the admin page when a new quiz is added', async () => {
        quizCommunicationServiceSpy.addQuiz.and.returnValue(of(quizToEditMock));

        await service.addQuizToServer(quizToEditMock);
        expect(quizCommunicationServiceSpy.addQuiz).toHaveBeenCalledWith(quizToEditMock);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('admin');
    });

    it('should redirect to admin page when a quiz is updated', async () => {
        quizCommunicationServiceSpy.updateQuiz.and.returnValue(of(quizToEditMock));

        await service.updateQuizOnServer(quizToEditMock.id, quizToEditMock);
        expect(quizCommunicationServiceSpy.updateQuiz).toHaveBeenCalledWith(quizToEditMock.id, quizToEditMock);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('admin');
    });

    it('should create a new quiz when updating a deleted quiz', async () => {
        quizCommunicationServiceSpy.updateQuiz.and.returnValue(throwError(() => new Error(`Quiz ${quizToEditMock.id} not found`)));
        const addQuizToServerSpy = spyOn(service, 'addQuizToServer');

        await service.updateQuizOnServer(quizToEditMock.id, quizToEditMock);
        expect(addQuizToServerSpy).toHaveBeenCalledWith(quizToEditMock);
    });

    it('should return fetched quiz', async () => {
        quizCommunicationServiceSpy.getQuiz.and.returnValue(of(quizToEditMock));
        const fetchedQuiz = await service.fetchQuiz(quizToEditMock.id);
        expect(fetchedQuiz).toBe(quizToEditMock);
    });

    it('should return undefined when fetching quiz with null id', async () => {
        const noQuiz = await service.fetchQuiz(null);
        expect(noQuiz).toBeUndefined();
    });

    it('should add a new question to the questions array of a quiz', () => {
        const nQuestions = quizToEditMock.questions.length;
        service.addNewQuestion(newQuestion, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(nQuestions + 1);
        expect(quizToEditMock.questions[1]).toEqual(newQuestion);
    });

    it('should correctly change a quiz question at a given index', () => {
        service.modifyQuestion(newQuestion, 0, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(1);
        expect(quizToEditMock.questions[0]).toEqual(newQuestion);
        expect(service.isModifiedQuestion).toEqual(false);
    });

    it('should not modify the questions array of a quiz when the given index is out of bounds', () => {
        const upperOutOfBoundsIndex = 1;
        service.modifyQuestion(newQuestion, upperOutOfBoundsIndex, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(1);
        expect(quizToEditMock.questions[0]).not.toEqual(newQuestion);
        const lowerOutOfBoundsIndex = -1;
        service.modifyQuestion(newQuestion, lowerOutOfBoundsIndex, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(1);
        expect(quizToEditMock.questions[0]).not.toEqual(newQuestion);
    });

    it('should delete the question at a given index', () => {
        service.addNewQuestion(newQuestion, quizToEditMock);
        const nQuestions = quizToEditMock.questions.length;
        service.deleteQuestion(0, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(nQuestions - 1);
        expect(quizToEditMock.questions[0]).toEqual(newQuestion);
    });

    it('should not delete any question when the given index is out of bounds', () => {
        const lowerOutOfBoundsIndex = -1;
        service.deleteQuestion(lowerOutOfBoundsIndex, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(1);
        const upperOutOfBoundsIndex = 3;
        service.deleteQuestion(upperOutOfBoundsIndex, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(1);
    });

    it('should update a quiz on server when handling an existing one', async () => {
        const updateQuizOnServerSpy = spyOn(service, 'updateQuizOnServer');
        await service.saveQuiz(quizToEditMock);
        expect(updateQuizOnServerSpy).toHaveBeenCalled();
        expect(updateQuizOnServerSpy).toHaveBeenCalledWith(quizToEditMock.id, quizToEditMock);
    });

    it('should create a new quiz on server when handling a brand new one', async () => {
        quizToEditMock.id = '';
        const addQuizToServerSpy = spyOn(service, 'addQuizToServer');

        await service.saveQuiz(quizToEditMock);
        expect(addQuizToServerSpy).toHaveBeenCalled();
        expect(addQuizToServerSpy).toHaveBeenCalledWith(quizToEditMock);
    });

    it('should correctly move a question up', () => {
        const previousFirstQuestion = quizToEditMock.questions[0];
        service.addNewQuestion(newQuestion, quizToEditMock);
        service.moveQuestionUp(1, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(2);
        expect(quizToEditMock.questions[0]).toEqual(newQuestion);
        expect(quizToEditMock.questions[1]).toEqual(previousFirstQuestion);
    });

    it('should not move question up when index is 0 or out of bounds', () => {
        service.addNewQuestion(newQuestion, quizToEditMock);
        const quizQuestions = [...quizToEditMock.questions];

        service.moveQuestionUp(0, quizToEditMock);
        expect(quizToEditMock.questions).toEqual(quizQuestions);
        service.moveQuestionUp(3, quizToEditMock);
        expect(quizToEditMock.questions).toEqual(quizQuestions);
    });

    it('should correctly move a question down', () => {
        const previousFirstQuestion = quizToEditMock.questions[0];
        service.addNewQuestion(newQuestion, quizToEditMock);
        service.moveQuestionDown(0, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(2);
        expect(quizToEditMock.questions[1]).toEqual(previousFirstQuestion);
        expect(quizToEditMock.questions[0]).toEqual(newQuestion);
    });

    it('should not move question down when index is the last or out of bounds', () => {
        service.addNewQuestion(newQuestion, quizToEditMock);
        const quizQuestions = [...quizToEditMock.questions];
        service.moveQuestionDown(1, quizToEditMock);
        expect(quizToEditMock.questions).toEqual(quizQuestions);
        service.moveQuestionDown(3, quizToEditMock);
        expect(quizToEditMock.questions).toEqual(quizQuestions);
    });

    it('should correctly update name, title and description', () => {
        const newQuizDuration = 50;
        const generalInfoFormMock = new FormGroup({
            title: new FormControl('new title'),
            description: new FormControl('dummy description edited'),
            duration: new FormControl(newQuizDuration),
        });
        service.updateGeneralInfo(quizToEditMock, generalInfoFormMock);
        expect(quizToEditMock.title).toEqual('new title');
        expect(quizToEditMock.description).toEqual('dummy description edited');
        expect(quizToEditMock.duration).toEqual(newQuizDuration);
    });

    it('should return true if quiz form is valid and either the title, description, or duration is modified (when newQuiz.id is not empty)', () => {
        const result = service.hasQuizBeenModified({ ...quizToEditMock, title: 'Modified title' });
        expect(result).toBe(true);
    });

    it('should return true if quiz form is valid and there are a different amount of questions (when newQuiz.id is not empty)', () => {
        const result = service.hasQuizBeenModified({
            ...quizToEditMock,
            questions: [
                ...quizToEditMock.questions,
                {
                    type: 'QCM',
                    text: 'Modified Question 2',
                    points: 10,
                    choices: [
                        { text: 'Modified Choice 1', isCorrect: true },
                        { text: 'Modified Choice 2', isCorrect: false },
                    ],
                },
            ],
        });
        expect(result).toBe(true);
    });

    it('should return true if quiz form is valid and the amount of choices of a question has been modified (when newQuiz.id is not empty)', () => {
        const modifiedQuestions = [...quizToEditMock.questions];
        const modifiedChoices = modifiedQuestions[0].choices as Choice[];
        modifiedQuestions[0] = {
            ...modifiedQuestions[0],
            choices: [...modifiedChoices, { text: 'Choice 3', isCorrect: true }],
        };
        const result = service.hasQuizBeenModified({ ...quizToEditMock, questions: modifiedQuestions });
        expect(result).toBe(true);
    });

    it('should return true if quiz form is valid and the information of a question choice was modified (when newQuiz.id is not empty)', () => {
        const modifiedQuestions = [...quizToEditMock.questions];
        if (modifiedQuestions[0].choices) {
            const modifiedChoices = modifiedQuestions[0].choices.slice(1);
            modifiedChoices[0] = {
                ...modifiedChoices[0],
                text: 'Modified Choice 1',
            };
            modifiedQuestions[0] = {
                ...modifiedQuestions[0],
                choices: modifiedChoices,
            };
        }
        const result = service.hasQuizBeenModified({ ...quizToEditMock, questions: modifiedQuestions });
        expect(result).toBe(true);
    });

    it('should return true if quiz form is valid and the information of a question was modified (when newQuiz.id is not empty)', () => {
        const modifiedQuestions = [...quizToEditMock.questions];
        modifiedQuestions[0] = {
            ...modifiedQuestions[0],
            type: 'ModifiedType',
            text: 'Modified Question Text',
            points: 20,
        };
        const result = service.hasQuizBeenModified({ ...quizToEditMock, questions: modifiedQuestions });
        expect(result).toBe(true);
    });

    it('should return false if quiz form is not modified (when newQuiz.id is not empty)', () => {
        const result = service.hasQuizBeenModified(quizToEditMock);
        expect(result).toBe(false);
    });

    it('should return true if a choice in the question has been modified', () => {
        const initialChoice: Choice = { text: 'Initial Choice', isCorrect: true };
        quizToEditMock.questions[0].choices = [initialChoice];
        const quiz = {
            ...quizToEditMock,
            questions: [
                {
                    ...quizToEditMock.questions[0],
                    choices: [{ ...initialChoice, text: 'Modified Text      ' }],
                },
            ],
        };

        const resultQuiz = service.hasQuizBeenModified(quiz as unknown as Quiz);
        expect(resultQuiz).toBe(true);
    });

    it('should adjust the modifiedIndex of a question when it is moved up', () => {
        const previousFirstQuestion = quizToEditMock.questions[0];
        service.addNewQuestion(newQuestion, quizToEditMock);
        service.modifiedIndex = 1;

        service.moveQuestionUp(1, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(2);
        expect(quizToEditMock.questions[0]).toEqual(newQuestion);
        expect(quizToEditMock.questions[1]).toEqual(previousFirstQuestion);
        expect(service.modifiedIndex).toBe(0);
    });

    it('should adjust the modifiedIndex of a question when it is moved down', () => {
        const previousFirstQuestion = quizToEditMock.questions[0];
        service.addNewQuestion(newQuestion, quizToEditMock);
        service.modifiedIndex = 0;

        service.moveQuestionDown(0, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(2);
        expect(quizToEditMock.questions[1]).toEqual(previousFirstQuestion);
        expect(quizToEditMock.questions[0]).toEqual(newQuestion);
        expect(service.modifiedIndex).toBe(1);
    });

    it('should adjust the modifiedIndex of the swapped question when a question is moved down', () => {
        const previousFirstQuestion = quizToEditMock.questions[0];
        service.addNewQuestion(newQuestion, quizToEditMock);
        service.modifiedIndex = 1;

        service.moveQuestionDown(0, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(2);
        expect(quizToEditMock.questions[1]).toEqual(previousFirstQuestion);
        expect(quizToEditMock.questions[0]).toEqual(newQuestion);
        expect(service.modifiedIndex).toBe(0);
    });

    it('should adjust the modifiedIndex of the swapped question when a question is moved up', () => {
        const previousFirstQuestion = quizToEditMock.questions[0];
        service.addNewQuestion(newQuestion, quizToEditMock);
        service.modifiedIndex = 0;

        service.moveQuestionUp(1, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(2);
        expect(quizToEditMock.questions[0]).toEqual(newQuestion);
        expect(quizToEditMock.questions[1]).toEqual(previousFirstQuestion);
        expect(service.modifiedIndex).toBe(1);
    });
});
