import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Question, Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from './communication.service';

@Injectable({
    providedIn: 'root',
})
export class NewQuizManagerService {
    quizzes: Quiz[];

    constructor(
        private readonly communicationService: CommunicationService,
        private router: Router,
    ) {
        this.getQuizListFromServer();
    }

    getQuizListFromServer(): void {
        this.communicationService.getQuizzes().subscribe({
            next: (quizzes) => {
                this.quizzes = quizzes;
            },
        });
    }

    async addQuizToServer(newQuiz: Quiz) {
        this.communicationService.addQuiz(newQuiz).subscribe({
            next: () => {
                this.router.navigateByUrl('admin');
            },
        });
    }

    async updateQuizOnServer(id: string, updatedQuiz: Quiz) {
        this.communicationService.updateQuiz(id, updatedQuiz).subscribe({
            next: () => {
                this.router.navigateByUrl('admin');
            },
            error: () => {
                this.addQuizToServer(updatedQuiz);
            },
        });
    }

    async fetchQuiz(id: string | null): Promise<Quiz | undefined> {
        if (id) {
            return new Promise<Quiz | undefined>((resolve) => {
                this.communicationService.getQuiz(id).subscribe({
                    next: (quiz) => {
                        resolve(quiz);
                    },
                });
            });
        }
        return undefined;
    }

    addNewQuestion(newQuestion: Question, quiz: Quiz) {
        if (quiz.questions.length === 0 || (quiz.questions.length === 1 && quiz.questions[0].text === '')) {
            quiz.questions[0] = newQuestion;
        } else {
            quiz.questions.push(newQuestion);
        }
    }

    modifyQuestion(question: Question, index: number, quiz: Quiz) {
        if (index >= 0 && index < quiz.questions.length) {
            quiz.questions[index] = question;
        }
    }

    deleteQuestion(index: number, quiz: Quiz) {
        if (index >= 0 && index < quiz.questions.length) {
            quiz.questions.splice(index, 1);
        }
    }

    saveQuiz(quiz: Quiz) {
        const date = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
        quiz.lastModification = date;

        if (quiz.id !== '') {
            this.updateQuizOnServer(quiz.id, quiz);
        } else {
            this.addQuizToServer(quiz);
        }
    }

    moveQuestionUp(index: number, quiz: Quiz) {
        if (index > 0) {
            const tmp = quiz.questions[index - 1];
            quiz.questions[index - 1] = quiz.questions[index];
            quiz.questions[index] = tmp;
        }
    }

    moveQuestionDown(index: number, quiz: Quiz) {
        if (index < quiz.questions.length - 1) {
            const tmp = quiz.questions[index + 1];
            quiz.questions[index + 1] = quiz.questions[index];
            quiz.questions[index] = tmp;
        }
    }

    updateGeneralInfo(quiz: Quiz, generalInfoForm: FormGroup) {
        quiz.title = generalInfoForm.value.title;
        quiz.description = generalInfoForm.value.description;
        quiz.duration = generalInfoForm.value.duration;
    }
}
