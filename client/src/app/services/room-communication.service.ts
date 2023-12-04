import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JoinRoomResponse, NewRoomResponse } from '@app/interfaces/join-room-response';
import { Quiz } from '@app/interfaces/quiz';
import { ChatMessage } from '@common/chat-message';
import { Results } from '@common/player-info';
import { QuestionChartData } from '@common/question-chart-data';
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

    createRoom(data: { quiz: Quiz; socketId: string }): Observable<NewRoomResponse> {
        return this.http.post<NewRoomResponse>(`${this.baseUrl}/rooms/new`, data).pipe(catchError(this.receiveError<NewRoomResponse>()));
    }

    getRoomPlayers(roomId: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/rooms/${roomId}/players`).pipe(catchError(this.receiveError<string[]>()));
    }

    getPlayerName(roomId: string, data: { socketId: string }): Observable<string> {
        return this.http.post<string>(`${this.baseUrl}/rooms/${roomId}/playerName`, data).pipe(catchError(this.receiveError<string>()));
    }

    getRoomQuiz(roomId: string): Observable<Quiz> {
        return this.http.get<Quiz>(`${this.baseUrl}/rooms/${roomId}/quiz`).pipe(catchError(this.receiveError<Quiz>()));
    }

    getPlayerResults(roomId: string): Observable<Results[]> {
        return this.http.get<Results[]>(`${this.baseUrl}/rooms/${roomId}/results`).pipe(catchError(this.receiveError<Results[]>()));
    }

    sendPlayerResults(roomId: string, results: Results[]): Observable<Results[]> {
        return this.http.post<Results[]>(`${this.baseUrl}/rooms/${roomId}/results`, results).pipe(catchError(this.receiveError<Results[]>()));
    }

    getChatMessages(roomId: string): Observable<ChatMessage[]> {
        return this.http.get<ChatMessage[]>(`${this.baseUrl}/rooms/${roomId}/chat`).pipe(catchError(this.receiveError<ChatMessage[]>()));
    }

    sendChatMessages(roomId: string, chatMessages: ChatMessage[]): Observable<ChatMessage[]> {
        return this.http
            .post<ChatMessage[]>(`${this.baseUrl}/rooms/${roomId}/chat`, chatMessages)
            .pipe(catchError(this.receiveError<ChatMessage[]>()));
    }

    getQuestionsChartData(roomId: string): Observable<QuestionChartData[]> {
        return this.http.get<QuestionChartData[]>(`${this.baseUrl}/rooms/${roomId}/chart`).pipe(catchError(this.receiveError<QuestionChartData[]>()));
    }

    sendQuestionsChartData(roomId: string, questionsChartData: QuestionChartData[]): Observable<QuestionChartData[]> {
        return this.http
            .post<QuestionChartData[]>(`${this.baseUrl}/rooms/${roomId}/chart`, questionsChartData)
            .pipe(catchError(this.receiveError<QuestionChartData[]>()));
    }

    private receiveError<T>() {
        return (error: HttpErrorResponse): Observable<T> => {
            const errorMessage = `${error.error}`;
            throw new Error(errorMessage);
        };
    }
}
