import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Question, Quiz } from '@app/interfaces/quiz';
import { BehaviorSubject } from 'rxjs';
import { CommunicationService } from './communication.service';

const date = new Date();
const dateStr = date.toLocaleString('en-US', { timeZone: 'America/New_York' });

@Injectable({
    providedIn: 'root',
})
export class NewQuizManagerService {
    message: string = '';
    quizzes: BehaviorSubject<Quiz[]> = new BehaviorSubject<Quiz[]>([]);
    selectedQuiz: BehaviorSubject<Quiz | null> = new BehaviorSubject<Quiz | null>(null);
    choiceIndex: number;
    quizToModify: Quiz;
    isQuizBeingModified: boolean;

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

    constructor(private readonly communicationService: CommunicationService) {
        this.getQuizListFromServer();
    }

    getQuizListFromServer(): void {
        this.communicationService.getQuizzes().subscribe({
            next: (quizzes) => {
                this.quizzes.next(quizzes);
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message = responseString;
            },
        });
    }

    addQuizToServer(newQuiz: Quiz): void {
        newQuiz.lastModification = dateStr;
        this.communicationService.addQuiz(newQuiz).subscribe({
            next: () => {
                this.getQuizListFromServer();
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message = responseString;
            },
        });
    }

    updateQuizOnServer(id: string, updatedQuiz: Quiz): void {
        this.communicationService.updateQuiz(id, updatedQuiz).subscribe({
            next: (quiz) => {
                quiz.lastModification = dateStr;
                this.selectedQuiz.next(quiz);
                this.getQuizListFromServer();
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message = responseString;
                this.addNewQuiz(updatedQuiz);
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
                this.message = responseString;
            },
        });
    }

    getQuizById(id: string): void {
        this.communicationService.getQuiz(id).subscribe({
            next: (quiz) => {
                this.quizToModify = quiz;
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message = responseString;
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
                this.message = responseString;
            },
        });
    }

    getNewQuiz(): Quiz {
        return this.newQuiz;
    }

    setNewQuiz(quiz: Quiz) {
        this.newQuiz = quiz;
    }

    getNewQuizQuestions() {
        return this.newQuiz.questions;
    }

    addNewQuestion(newQuestion: Question) {
        if (this.newQuiz.questions.length === 0 || (this.newQuiz.questions.length === 1 && this.newQuiz.questions[0].text === '')) {
            this.newQuiz.questions[0] = newQuestion;
        } else {
            this.newQuiz.questions.push(newQuestion);
        }
    }

    modifyQuestion(question: Question, index: number) {
        if (index !== undefined && index !== null && index >= 0 && index < this.newQuiz.questions.length) {
            this.newQuiz.questions[index] = question;
        }
    }

    setQuizToModify(quizForModification: Quiz) {
        this.newQuiz = quizForModification;
    }

    getQuizToModify() {
        return this.newQuiz;
    }

    addNewQuiz(quiz: Quiz) {
        this.addQuizToServer(quiz);
    }

    updateQuiz(id: string, quiz: Quiz) {
        this.updateQuizOnServer(id, quiz);
    }
}
