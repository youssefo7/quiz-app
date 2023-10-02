import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private http: HttpClient) {}

    getQuizzes(): Observable<Quiz[]> {
        return this.http.get<Quiz[]>(`${this.baseUrl}/quizzes/`).pipe(catchError(this.receiveError<Quiz[]>()));
    }

    getQuiz(id: string): Observable<Quiz> {
        return this.http.get<Quiz>(`${this.baseUrl}/quizzes/${id}`).pipe(catchError(this.receiveError<Quiz>()));
    }

    addQuiz(newQuiz: Quiz): Observable<Quiz> {
        return this.http.post<Quiz>(`${this.baseUrl}/quizzes/`, newQuiz).pipe(catchError(this.receiveError<Quiz>()));
    }

    updateQuiz(id: string, updatedQuiz: Quiz): Observable<Quiz> {
        return this.http.put<Quiz>(`${this.baseUrl}/quizzes/${id}`, updatedQuiz).pipe(catchError(this.receiveError<Quiz>()));
    }

    deleteQuiz(id: string): Observable<string> {
        return this.http.delete<string>(`${this.baseUrl}/quizzes/${id}`).pipe(catchError(this.receiveError<string>()));
    }

    checkQuizAvailability(id: string): Observable<boolean> {
        return this.http.get<boolean>(`${this.baseUrl}/quizzes/available/${id}`).pipe(catchError(this.receiveError<boolean>()));
    }

    checkQuizVisibility(id: string): Observable<boolean> {
        return this.http.get<boolean>(`${this.baseUrl}/quizzes/visible/${id}`).pipe(catchError(this.receiveError<boolean>()));
    }

    importQuiz(quiz: Quiz): Observable<Quiz> {
        return this.http.post<Quiz>(`${this.baseUrl}/quizzes/import`, quiz).pipe(catchError(this.receiveError<Quiz>()));
    }

    private receiveError<T>() {
        return (error: HttpErrorResponse): Observable<T> => {
            const errorMessage = `${error.error}`;
            throw new Error(errorMessage);
        };
    }
}
