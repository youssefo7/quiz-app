import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Question, Quiz } from '@app/interfaces/quiz';
import { BehaviorSubject } from 'rxjs';
import { CommunicationService } from './communication.service';

@Injectable({
    providedIn: 'root',
})
export class NewQuizManagerService {
    message: string = '';
    quizzes: BehaviorSubject<Quiz[]>;
    selectedQuiz: BehaviorSubject<Quiz | null>;
    choiceIndex: number;
    quizToModify: Quiz;
    isQuizBeingModified: boolean;

    private newQuiz: Quiz = {
        $schema: 'quiz-schema.json',
        id: '',
        title: '',
        description: '',
        duration: 0,
        lastModification: '',
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
        this.quizzes = new BehaviorSubject<Quiz[]>([]);
        this.selectedQuiz = new BehaviorSubject<Quiz | null>(null);
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

    async addQuizToServer(newQuiz: Quiz) {
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

    async updateQuizOnServer(id: string, updatedQuiz: Quiz) {
        this.communicationService.updateQuiz(id, updatedQuiz).subscribe({
            next: (quiz) => {
                this.selectedQuiz.next(quiz);
                this.getQuizListFromServer();
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message = responseString;
                this.addQuizToServer(updatedQuiz);
            },  
        });
    }

    async getQuizFromServer(id: string) {
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

    async getQuizById(id: string): Promise<Quiz | undefined> {
        if (id) {
          return new Promise<Quiz | undefined>((resolve, reject) => {
            this.communicationService.getQuiz(id).subscribe({
              next: (quiz) => {
                resolve(quiz);
              },
              error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message = responseString;
                reject(err);
              },
            });
          });
        }
        return undefined;
      }

    async deleteQuizFromServer(id: string) {
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

    setQuiz(quiz: Quiz) {
        this.newQuiz = quiz;
    }

    getNewQuizQuestions() {
        return this.newQuiz.questions;
    }

    setQuizToModify(quiz: Quiz) {
        this.newQuiz = quiz;
    }

    getQuizToModify(): Quiz {
        return this.newQuiz;
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

    saveQuiz(id: string, quiz: Quiz, isQuizToModify: boolean) {
        if (isQuizToModify) {
            this.updateQuizOnServer(id, quiz);
        } else {
            this.addQuizToServer(quiz);
        }
    }

    setGeneralInfoData(title: string, description: string, duration: number) {
        this.newQuiz.title = title;
        this.newQuiz.description = description;
        this.newQuiz.duration = duration;
    }

    // addNewQuiz(quiz: Quiz) {
    //     this.addQuizToServer(quiz);
    // }

    // updateQuiz(id: string, quiz: Quiz) {
    //     this.updateQuizOnServer(id, quiz);
    // }

    moveQuestionUp(index: number) {
        if (index > 0) {
            const tmp = this.newQuiz.questions[index - 1];
            this.newQuiz.questions[index - 1] = this.newQuiz.questions[index];
            this.newQuiz.questions[index] = tmp;
        }
    }

    moveQuestionDown(index: number) {
        if (index < this.newQuiz.questions.length - 1) {
            const tmp = this.newQuiz.questions[index + 1];
            this.newQuiz.questions[index + 1] = this.newQuiz.questions[index];
            this.newQuiz.questions[index] = tmp;
        }
    }
}
