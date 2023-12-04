// Nous avons besoin d'assigner des arrays avec plusieurs valeurs pour les informations d'un chart
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { JoinRoomResponse, NewRoomResponse } from '@app/interfaces/join-room-response';
import { Quiz } from '@app/interfaces/quiz';
import { QuestionChartData } from '@common/question-chart-data';
import { RoomCommunicationService } from './room-communication.service';

describe('RoomCommunicationService', () => {
    let httpMock: HttpTestingController;
    let service: RoomCommunicationService;
    let baseUrl: string;

    const roomId = 'mockRoomId';
    const mockPlayerResults = [
        { name: 'p1', points: 10, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: true, bonusCount: 2 },
        { name: 'p2', points: 10, hasAbandoned: false, hasClickedOnAnswerField: false, hasConfirmedAnswer: true, bonusCount: 2 },
    ];
    const mockQuestionsChartData: QuestionChartData[] = [
        { playersChoices: ['C1', 'C2'], interactionsCount: [10, 20] },
        { playersChoices: ['C3', 'C4'], interactionsCount: [5, 8] },
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [RoomCommunicationService],
        });
        service = TestBed.inject(RoomCommunicationService);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = service['baseUrl'];
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should process the username when sending POST request with username, room and socket id in body (HttpClient called once)', () => {
        const usernameData = { name: 'name', socketId: 'mockSocketId' };
        const mockResult = true;

        service.processUsername(roomId, usernameData).subscribe({
            next: (response) => {
                expect(response).toBe(mockResult);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/${roomId}/name`);
        expect(req.request.method).toBe('POST');
        req.flush(mockResult);
    });

    it('should return JoinRoomResponse when sending POST request with room and socket id body (HttpClient called once)', () => {
        const joinData = { socketId: 'mockSocketId' };
        const mockJoinRoomResponse: JoinRoomResponse = {
            roomState: 'mockState',
            quiz: {} as Quiz,
        };

        service.joinRoom(roomId, joinData).subscribe({
            next: (response) => {
                expect(response).toEqual(mockJoinRoomResponse);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/${roomId}/join`);
        expect(req.request.method).toBe('POST');
        req.flush(mockJoinRoomResponse);
    });

    it('should create a room when sending POST request with quiz and socket id in body (HttpClient called once)', () => {
        const postRequestData = { quiz: {} as Quiz, socketId: 'mockSocketId' };
        const mockNewRoomResponse: NewRoomResponse = { roomId };

        service.createRoom(postRequestData).subscribe({
            next: (response) => {
                expect(response).toBe(mockNewRoomResponse);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/new`);
        expect(req.request.method).toBe('POST');
        req.flush(mockNewRoomResponse);
    });

    it('should get a list of players in a room when sending GET request with /rooms/:roomId/players param (HTTPClient called once)', () => {
        const mockPlayers = ['player1', 'player2'];

        service.getRoomPlayers(roomId).subscribe({
            next: (response) => {
                expect(response).toEqual(mockPlayers);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/${roomId}/players`);
        expect(req.request.method).toBe('GET');
        req.flush(mockPlayers);
    });

    it('should get player results in a room when sending GET request with /rooms/:roomId/results param (HTTPClient called once)', () => {
        service.getPlayerResults(roomId).subscribe({
            next: (response) => {
                expect(response).toEqual(mockPlayerResults);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/${roomId}/results`);
        expect(req.request.method).toBe('GET');
        req.flush(mockPlayerResults);
    });

    it('should send player results in a room when sending POST request with /rooms/:roomId/results param (HTTPClient called once)', () => {
        service.sendPlayerResults(roomId, mockPlayerResults).subscribe({
            next: (response) => {
                expect(response).toEqual(mockPlayerResults);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/${roomId}/results`);
        expect(req.request.method).toBe('POST');
        req.flush(mockPlayerResults);
    });

    it('should get chat messages in a room when sending GET request with /rooms/:roomId/chat param (HTTPClient called once)', () => {
        const mockChatMessages = [
            { authorName: 'p1', time: '10', message: 'hi', fromSystem: false },
            { authorName: 'p1', time: '20', message: 'hey', fromSystem: false },
        ];

        service.getChatMessages(roomId).subscribe({
            next: (response) => {
                expect(response).toEqual(mockChatMessages);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/${roomId}/chat`);
        expect(req.request.method).toBe('GET');
        req.flush(mockChatMessages);
    });

    it('should send chat messages in a room when sending POST request with /rooms/:roomId/chat param (HTTPClient called once)', () => {
        const mockChatMessages = [
            { authorName: 'p1', time: '10', message: 'hi', fromSystem: false },
            { authorName: 'p1', time: '20', message: 'hey', fromSystem: false },
        ];

        service.sendChatMessages(roomId, mockChatMessages).subscribe({
            next: (response) => {
                expect(response).toEqual(mockChatMessages);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/${roomId}/chat`);
        expect(req.request.method).toBe('POST');
        req.flush(mockChatMessages);
    });

    it('should get a player name when sending POST request with socket id in body (HTTPClient called once)', () => {
        const mockPlayerName = 'player';
        const playerNameData = { socketId: 'mockSocketId' };

        service.getPlayerName(roomId, playerNameData).subscribe({
            next: (response) => {
                expect(response).toBe(mockPlayerName);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/${roomId}/playerName`);
        expect(req.request.method).toBe('POST');
        req.flush(mockPlayerName);
    });

    it('should get a quiz when sending GET request with /rooms/:roomId/quiz param (HTTPClient called once)', () => {
        const mockQuiz = {} as Quiz;

        service.getRoomQuiz(roomId).subscribe({
            next: (response) => {
                expect(response).toEqual(mockQuiz);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/${roomId}/quiz`);
        expect(req.request.method).toBe('GET');
        req.flush(mockQuiz);
    });

    it('should receive error from server', () => {
        const nonExistentId = 'nonExistentId';

        service.getRoomPlayers(nonExistentId).subscribe({
            next: () => {
                fail('Expected an error');
            },
            error: (error) => {
                expect(error.message).toBe('Room nonExistentId not found');
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/${nonExistentId}/players`);
        expect(req.request.method).toBe('GET');

        req.flush('Room nonExistentId not found', { status: 404, statusText: 'Not Found' });
    });

    it('should get questions chart data in a room when sending GET request with /rooms/:roomId/chart param (HTTPClient called once)', () => {
        service.getQuestionsChartData(roomId).subscribe({
            next: (response) => {
                expect(response).toEqual(mockQuestionsChartData);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/${roomId}/chart`);
        expect(req.request.method).toBe('GET');
        req.flush(mockQuestionsChartData);
    });

    it('should send questions chart data successfully when sending POST request with /rooms/:roomId/chart param (HTTPClient called once)', () => {
        service.sendQuestionsChartData(roomId, mockQuestionsChartData).subscribe({
            next: (response) => {
                expect(response).toEqual(mockQuestionsChartData);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/${roomId}/chart`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockQuestionsChartData);
        req.flush(mockQuestionsChartData);
    });
});
