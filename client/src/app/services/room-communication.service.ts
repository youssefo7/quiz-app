import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JoinRoomResponse } from '@app/interfaces/join-room-response';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class RoomCommunicationService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private http: HttpClient) {}

    processUsername(roomId: string, data: { name: string; socketId: string }): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}/rooms/${roomId}/name`, data).pipe(catchError(this.receiveError<boolean>()));
    }

    joinRoom(roomId: string, data: { socketId: string }): Observable<JoinRoomResponse> {
        return this.http.post<JoinRoomResponse>(`${this.baseUrl}/rooms/${roomId}/join`, data).pipe(catchError(this.receiveError<JoinRoomResponse>()));
    }

    createRoom(data: { quizId: string; socketId: string }): Observable<string> {
        return this.http.post<string>(`${this.baseUrl}/rooms/new`, data).pipe(catchError(this.receiveError<string>()));
    }

    getRoomPlayers(roomId: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/rooms/${roomId}/players`).pipe(catchError(this.receiveError<string[]>()));
    }

    private receiveError<T>() {
        return (error: HttpErrorResponse): Observable<T> => {
            const errorMessage = `${error.error}`;
            throw new Error(errorMessage);
        };
    }
}
