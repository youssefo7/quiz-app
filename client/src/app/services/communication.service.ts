import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { Message } from '@common/message';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    private readonly baseUrl: string = environment.serverUrl;
    private quizzesURL = '../assets/quizzes.json'; // fichier test pour generer une liste de jeux

    constructor(private readonly http: HttpClient) {}

    basicGet(): Observable<Message> {
        return this.http.get<Message>(`${this.baseUrl}/example`).pipe(catchError(this.handleError<Message>('basicGet')));
    }

    basicPost(message: Message): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/example/send`, message, { observe: 'response', responseType: 'text' });
    }

    getQuizzes(): Observable<Quiz[]> {
        return this.http.get<Quiz[]>(this.quizzesURL);
    }

    getQuiz(id: string): Observable<Quiz> {
        return this.http.get<Quiz>(`${this.baseUrl}/quizzes/${id}`).pipe(catchError(this.handleError<Quiz>('getQuiz')));
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
