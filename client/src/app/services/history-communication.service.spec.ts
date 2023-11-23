import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { History } from '@app/interfaces/history';
import { HistoryCommunicationService } from './history-communication.service';

describe('HistoryCommunicationService', () => {
    let httpMock: HttpTestingController;
    let service: HistoryCommunicationService;
    let baseUrl: string;

    const historyList: History[] = [
        { name: 'test', date: 'test', numberOfPlayers: 1, maxScore: 1 },
        { name: 'test2', date: 'test2', numberOfPlayers: 2, maxScore: 2 },
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(HistoryCommunicationService);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = service['baseUrl'];
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add a new History when sending POST request with body (HttpClient called once)', () => {
        const newHistory = historyList[0];

        service.addHistory(newHistory).subscribe({
            next: (response) => {
                expect(response).toEqual(newHistory);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/history/`);
        expect(req.request.method).toBe('POST');
        req.flush(newHistory);
    });

    it('should return History list when sending GET request (HttpClient called once)', () => {
        service.getAllHistory().subscribe({
            next: (response) => {
                expect(response).toEqual(historyList);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/history/`);
        expect(req.request.method).toBe('GET');
        req.flush(historyList);
    });

    it('should delete all History when sending DELETE request (HttpClient called once)', () => {
        service.deleteAllHistory().subscribe({
            next: (response) => {
                expect(response).toEqual('History deleted');
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/history/`);
        expect(req.request.method).toBe('DELETE');
        req.flush('History deleted');
    });

    it('receive error from server', () => {
        service.addHistory(historyList[0]).subscribe({
            next: () => {
                fail('expected an error');
            },
            error: (error) => {
                expect(error.message).toBe('error');
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/history/`);
        expect(req.request.method).toBe('POST');
        req.flush('error', { status: 400, statusText: 'Bad Request' });
    });
});
