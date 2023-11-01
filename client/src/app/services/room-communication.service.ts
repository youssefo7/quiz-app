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

    getNameValidity(data: { name: string; roomId: string; socketId: string }): Observable<boolean> {
        return this.http.post<boolean>(`${this.baseUrl}/rooms/name`, data).pipe(catchError(this.receiveError<boolean>()));
    }

    joinRoom(data: { roomId: string; socketId: string }): Observable<JoinRoomResponse> {
        return this.http.post<JoinRoomResponse>(`${this.baseUrl}/rooms/join`, data).pipe(catchError(this.receiveError<JoinRoomResponse>()));
    }

    private receiveError<T>() {
        return (error: HttpErrorResponse): Observable<T> => {
            const errorMessage = `${error.error}`;
            throw new Error(errorMessage);
        };
    }
}
