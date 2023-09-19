import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { BehaviorSubject } from 'rxjs';
import { CommunicationService } from './communication.service';

const date = new Date();
const dateStr = date.toLocaleString('en-US', { timeZone: 'America/New_York' });

@Injectable({
    providedIn: 'root',
})
export class NewQuizManagerService {
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');
    quizzes: BehaviorSubject<Quiz[]> = new BehaviorSubject<Quiz[]>([]);
    selectedQuiz: BehaviorSubject<Quiz | null> = new BehaviorSubject<Quiz | null>(null);

    private newQuiz: Quiz = {
        $schema: '',
        id: '',
        title: '',
        description: '',
        duration: 0,
        lastModification: dateStr,
        visibility: false,
        questions: [
            {
                type: '',
                text: '',
                points: 0,
                choices: [
                    {
                        text: '',
                        isCorrect: false,
                    },
                ],
            },
        ],
    };

    constructor(private readonly communicationService: CommunicationService) {}

    // ngOnInit(): void {
    //     this.getQuizListFromServer();
    // }

    getQuizListFromServer(): void {
        this.communicationService.getQuizzes().subscribe({
            next: (quizzes) => {
                this.quizzes.next(quizzes);
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message.next(responseString);
            },
        });
    }

    addQuizToServer(newQuiz: Quiz): void {
        newQuiz.lastModification = dateStr;
        this.communicationService.addQuiz(newQuiz).subscribe({
            next: () => {
                this.getQuizListFromServer();
                newQuiz.id = '';
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message.next(responseString);
            },
        });
    }

    getQuizFromServer(id: string): void {
        this.communicationService.getQuiz(id).subscribe({
            next: (quiz) => {
                this.selectedQuiz.next(quiz);
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message.next(responseString);
            },
        });
    }

    deleteQuizFromServer(id: string): void {
        this.communicationService.deleteQuiz(id).subscribe({
            next: () => {
                this.getQuizListFromServer();
                this.selectedQuiz.next(null);
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message.next(responseString);
            },
        });
    }

    getNewQuiz(): Quiz {
        return this.newQuiz;
    }
}
