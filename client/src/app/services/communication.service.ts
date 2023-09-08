import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { Message } from '@common/message';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Game } from '@app/interfaces/games';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    private readonly baseUrl: string = environment.serverUrl;
    private gamesUrl = '../assets/example-list-of-games.json'; // fichier test pour generer une liste de jeux

    constructor(private readonly http: HttpClient) {}

    getGames(): Observable<Game[]> {
        return this.http.get<Game[]>(this.gamesUrl);
    }
    basicGet(): Observable<Message> {
        return this.http.get<Message>(`${this.baseUrl}/example`).pipe(catchError(this.handleError<Message>('basicGet')));
    }

    basicPost(message: Message): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/example/send`, message, { observe: 'response', responseType: 'text' });
    }

    getQuizzes(): Observable<Quiz[]> {
        return this.http.get<Quiz[]>(`${this.baseUrl}/quizzes/`).pipe(catchError(this.handleError<Quiz[]>('getQuizzes')));
    }

    getQuiz(id: string): Observable<Quiz> {
        return this.http.get<Quiz>(`${this.baseUrl}/quizzes/${id}`).pipe(catchError(this.handleError<Quiz>('getQuiz')));
    }

    addQuiz(newQuiz: Quiz): Observable<Quiz> {
        return this.http.post<Quiz>(`${this.baseUrl}/quizzes/`, newQuiz).pipe(catchError(this.handleError<Quiz>('addQuiz')));
    }

    updateQuiz(id: string, updatedQuiz: Quiz): Observable<Quiz> {
        return this.http.put<Quiz>(`${this.baseUrl}/quizzes/${id}`, updatedQuiz).pipe(catchError(this.handleError<Quiz>('updateQuiz')));
    }

    deleteQuiz(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/quizzes/${id}`).pipe(catchError(this.handleError<void>('deleteQuiz')));
    }

    exportQuiz(id: string): Observable<Quiz> {
        return this.http.get<Quiz>(`${this.baseUrl}/quizzes/export/${id}`).pipe(catchError(this.handleError<Quiz>('exportQuiz')));
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
