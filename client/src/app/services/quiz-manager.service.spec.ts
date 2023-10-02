import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Question, Quiz } from '@app/interfaces/quiz';
import { of, throwError } from 'rxjs';
import { CommunicationService } from './communication.service';
import { QuizManagerService } from './quiz-manager.service';

import SpyObj = jasmine.SpyObj;

describe('QuizManagerService', () => {
    let service: QuizManagerService;
    let communicationServiceSpy: SpyObj<CommunicationService>;
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
            $schema: 'quiz-schema.json',
            id: '01',
            title: 'Quiz1',
            duration: 60,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: true,
            description: 'first quiz of the list',
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
            $schema: 'quiz-schema.json',
            id: '02',
            title: 'Quiz2',
            duration: 60,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: false,
            description: 'second quiz of the list',
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
        communicationServiceSpy = jasmine.createSpyObj(CommunicationService, ['getQuizzes', 'addQuiz', 'updateQuiz', 'getQuiz']);
        communicationServiceSpy.getQuizzes.and.returnValue(of([]));
        routerSpy = jasmine.createSpyObj(Router, ['navigateByUrl']);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: CommunicationService, useValue: communicationServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        service = TestBed.inject(QuizManagerService);

        quizToEditMock = {
            $schema: 'quiz-schema.json',
            id: '1',
            title: 'test',
            duration: 60,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: true,
            description: 'dummy description',
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
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch quizzes', () => {
        communicationServiceSpy.getQuizzes.and.returnValue(of(quizListMock));
        service.getQuizListFromServer();
        expect(service.quizzes).toEqual(quizListMock);
    });

    it('should redirect to the admin page when a new quiz is added', () => {
        communicationServiceSpy.addQuiz.and.returnValue(of(quizToEditMock));

        service.addQuizToServer(quizToEditMock);
        expect(communicationServiceSpy.addQuiz).toHaveBeenCalledWith(quizToEditMock);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('admin');
    });

    it('should redirect to admin page when a quiz is updated', () => {
        communicationServiceSpy.updateQuiz.and.returnValue(of(quizToEditMock));

        service.updateQuizOnServer(quizToEditMock.id, quizToEditMock);
        expect(communicationServiceSpy.updateQuiz).toHaveBeenCalledWith(quizToEditMock.id, quizToEditMock);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('admin');
    });

    it('should create a new quiz when updating a deleted quiz', () => {
        communicationServiceSpy.updateQuiz.and.returnValue(throwError(() => new Error(`Quiz ${quizToEditMock.id} not found`)));
        const addQuizToServerSpy = spyOn(service, 'addQuizToServer');

        service.updateQuizOnServer(quizToEditMock.id, quizToEditMock);
        expect(addQuizToServerSpy).toHaveBeenCalledWith(quizToEditMock);
    });

    it('should return fetched quiz', async () => {
        communicationServiceSpy.getQuiz.and.returnValue(of(quizToEditMock));
        const fetchedQuiz = await service.fetchQuiz(quizToEditMock.id);
        expect(fetchedQuiz).toBe(quizToEditMock);
    });

    it('should return undefined when fetching quiz with null id', async () => {
        const noQuiz = await service.fetchQuiz(null);
        expect(noQuiz).toBeUndefined();
    });

    it('should add a new question to the questions array of a quiz', () => {
        service.addNewQuestion(newQuestion, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(2);
        expect(quizToEditMock.questions[1]).toEqual(newQuestion);
    });

    it('should correctly change a quiz question at a given index', () => {
        service.modifyQuestion(newQuestion, 0, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(1);
        expect(quizToEditMock.questions[0]).toEqual(newQuestion);
    });

    it('should not modify the questions array of a quiz when the given index is out of bounds', () => {
        let outOfBoundsIndex = 1;

        service.modifyQuestion(newQuestion, outOfBoundsIndex, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(1);
        expect(quizToEditMock.questions[0]).not.toEqual(newQuestion);

        outOfBoundsIndex -= 2;
        service.modifyQuestion(newQuestion, outOfBoundsIndex, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(1);
        expect(quizToEditMock.questions[0]).not.toEqual(newQuestion);
    });

    it('should delete the question at a given index', () => {
        service.addNewQuestion(newQuestion, quizToEditMock);
        service.deleteQuestion(0, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(1);
        expect(quizToEditMock.questions[0]).toEqual(newQuestion);
    });

    it('should not delete any question when the given index is out of bounds', () => {
        let outOfBoundsIndex = -1;
        service.deleteQuestion(outOfBoundsIndex, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(1);

        outOfBoundsIndex = 3;
        service.deleteQuestion(outOfBoundsIndex, quizToEditMock);
        expect(quizToEditMock.questions.length).toEqual(1);
    });

    it('should update a quiz on server when handling an existing one', () => {
        const updateQuizOnServerSpy = spyOn(service, 'updateQuizOnServer');
        service.saveQuiz(quizToEditMock);
        expect(updateQuizOnServerSpy).toHaveBeenCalled();
        expect(updateQuizOnServerSpy).toHaveBeenCalledWith(quizToEditMock.id, quizToEditMock);
    });

    it('should create a new quiz on server when handling a brand new one', () => {
        quizToEditMock.id = '';
        const addQuizToServerSpy = spyOn(service, 'addQuizToServer');

        service.saveQuiz(quizToEditMock);
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
        const quizQuestions = quizToEditMock.questions;

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
        const quizQuestions = quizToEditMock.questions;

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
});
