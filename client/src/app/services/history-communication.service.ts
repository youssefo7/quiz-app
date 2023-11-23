import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { History } from '@app/interfaces/history';
import { Observable, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class HistoryCommunicationService {
    private readonly baseUrl: string = environment.serverUrl;
    constructor(private http: HttpClient) {}

    addHistory(newHistory: History): Observable<History> {
        return this.http.post<History>(`${this.baseUrl}/history/`, newHistory).pipe(catchError(this.receiveError<History>()));
    }

    getAllHistory(): Observable<History[]> {
        return this.http.get<History[]>(`${this.baseUrl}/history/`).pipe(catchError(this.receiveError<History[]>()));
    }

    deleteAllHistory(): Observable<string> {
        return this.http.delete<string>(`${this.baseUrl}/history/`).pipe(catchError(this.receiveError<string>()));
    }

    private receiveError<T>() {
        return (error: HttpErrorResponse): Observable<T> => {
            const errorMessage = `${error.error}`;
            throw new Error(errorMessage);
        };
    }
}
