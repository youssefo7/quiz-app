import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { JoinRoomResponse } from '@app/interfaces/join-room-response';
import { RoomCommunicationService } from './room-communication.service';

describe('RoomCommunicationService', () => {
    let httpMock: HttpTestingController;
    let service: RoomCommunicationService;
    let baseUrl: string;

    const roomId = 'mockRoomId';

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
            quizId: 'mockId',
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
        const mockRoomId = '1234';
        const createData = { quizId: 'mockQuizId', socketId: 'mockSocketId' };

        service.createRoom(createData).subscribe({
            next: (response) => {
                expect(response).toBe(mockRoomId);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/rooms/new`);
        expect(req.request.method).toBe('POST');
        req.flush(mockRoomId);
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
});
