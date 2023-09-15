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

    constructor(private readonly http: HttpClient) {}

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

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
