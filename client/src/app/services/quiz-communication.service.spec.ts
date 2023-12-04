import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Quiz } from '@app/interfaces/quiz';
import { QuizCommunicationService } from '@app/services/quiz-communication.service';

describe('CommunicationService', () => {
    let httpMock: HttpTestingController;
    let service: QuizCommunicationService;
    let baseUrl: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(QuizCommunicationService);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = service['baseUrl'];
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return expected Quiz list when sending GET request (HttpClient called once)', () => {
        const mockQuizzes = quizList;

        service.getQuizzes().subscribe({
            next: (response) => {
                expect(response).toEqual(mockQuizzes);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/quizzes/`);
        expect(req.request.method).toBe('GET');
        req.flush(mockQuizzes);
    });

    it('should return expected Quiz when sending GET request with id param (HttpClient called once)', () => {
        const mockQuiz = quizList[0];

        service.getQuiz('1a2b3c').subscribe({
            next: (response) => {
                expect(response).toEqual(mockQuiz);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/quizzes/1a2b3c`);
        expect(req.request.method).toBe('GET');
        req.flush(mockQuiz);
    });

    it('should add a new Quiz when sending POST request with body (HttpClient called once)', () => {
        const newQuiz = { ...quizList[0], id: 'new' };

        service.addQuiz(newQuiz).subscribe({
            next: (response) => {
                expect(response).toEqual(newQuiz);
            },
            error: fail,
        });

        const req = httpMock.expectOne((request) => {
            return request.url === `${baseUrl}/quizzes/` && request.method === 'POST' && JSON.stringify(request.body) === JSON.stringify(newQuiz);
        });
        expect(req.request.method).toBe('POST');
        req.flush(newQuiz);
    });

    it('should update a Quiz when sending PUT request with body and id param (HTTPClient called once)', () => {
        const updatedQuiz = { ...quizList[0], title: 'new title' };

        service.updateQuiz('new', updatedQuiz).subscribe({
            next: (response) => {
                expect(response).toEqual(updatedQuiz);
            },
            error: fail,
        });

        const req = httpMock.expectOne((request) => {
            return (
                request.url === `${baseUrl}/quizzes/new` && request.method === 'PUT' && JSON.stringify(request.body) === JSON.stringify(updatedQuiz)
            );
        });
        expect(req.request.method).toBe('PUT');
        req.flush(updatedQuiz);
    });

    it('should delete a Quiz when sending DELETE request with id param (HTTPClient called once)', () => {
        const mockId = 'test';

        service.deleteQuiz(mockId).subscribe({
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/quizzes/${mockId}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
    });

    it('should check availability of a Quiz when sending GET request with /available/:id param (HTTPClient called once)', () => {
        const mockId = 'test';

        service.checkQuizAvailability(mockId).subscribe({
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/quizzes/available/${mockId}`);
        expect(req.request.method).toBe('GET');
        req.flush(true);
    });

    it('should check visibility of a Quiz when sending GET request with /visible/:id param (HTTPClient called once)', () => {
        const mockId = 'test';

        service.checkQuizVisibility(mockId).subscribe({
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/quizzes/visible/${mockId}`);
        expect(req.request.method).toBe('GET');
        req.flush(true);
    });

    it('should import a Quiz when sending POST request with body and /import (HTTPClient called once)', () => {
        const mockQuiz = quizList[0];

        service.importQuiz(mockQuiz).subscribe({
            next: (response) => {
                expect(response).toEqual(mockQuiz);
            },
            error: fail,
        });

        const req = httpMock.expectOne((request) => {
            return (
                request.url === `${baseUrl}/quizzes/import` && request.method === 'POST' && JSON.stringify(request.body) === JSON.stringify(mockQuiz)
            );
        });
        expect(req.request.method).toBe('POST');
        req.flush(mockQuiz);
    });

    it('should receive error from server', () => {
        const nonExistentId = 'nonExistentId';

        service.getQuiz(nonExistentId).subscribe({
            next: () => {
                fail('Expected an error');
            },
            error: (error) => {
                expect(error.message).toBe('Quiz nonExistentId not found');
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/quizzes/${nonExistentId}`);
        expect(req.request.method).toBe('GET');

        req.flush('Quiz nonExistentId not found', { status: 404, statusText: 'Not Found' });
    });
});

const quizList: Quiz[] = [
    {
        id: '1a2b3c',
        title: 'Questionnaire sur le JS',
        duration: 60,
        lastModification: '2018-11-13T20:20:39+00:00',
        description: '',
        visibility: false,
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
