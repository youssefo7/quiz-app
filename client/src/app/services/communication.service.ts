import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
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

    deleteQuiz(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/quizzes/${id}`).pipe(catchError(this.receiveError<void>()));
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

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }

    // handleError ignores error message sent in response body from server and returns an Observable
    // receiveError uses HTTPErrorResponse to catch error message sent in response body from server
    private receiveError<T>() {
        return (error: HttpErrorResponse): Observable<T> => {
            const errorMessage = `${error.error}`;
            throw new Error(errorMessage);
        };
    }

    // example of error catching:
    // getQuizFromServer(id: string): void {
    //     this.communicationService.getQuiz(id).subscribe({
    //         next: (game) => {
    //             this.selectedQuiz.next(game);
    //             this.updatedQuiz = game;
    //             console.log(game);
    //         },
    //         error: (err: HttpErrorResponse) => {
    //             const errorMessage = `Le serveur a retourné : ${err.message}`;
    //             console.log(errorMessage);
    //             this.message.next(errorMessage);
    //         },
    //     });
    // }
}
