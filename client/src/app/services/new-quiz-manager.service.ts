import { Injectable } from '@angular/core';
import { Question, Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from './communication.service';

@Injectable({
    providedIn: 'root',
})
export class NewQuizManagerService {
    quizzes: Quiz[];
    quizId: string | null = null;

    /*     newQuiz: Quiz | undefined = {
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
    }; */

    constructor(private readonly communicationService: CommunicationService) {
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
        this.communicationService.addQuiz(newQuiz).subscribe();
    }

    async updateQuizOnServer(id: string, updatedQuiz: Quiz) {
        this.communicationService.updateQuiz(id, updatedQuiz).subscribe();
    }

    async fetchQuiz(id: string | null): Promise<Quiz | undefined> {
        if (id) {
            return new Promise<Quiz | undefined>((resolve) => {
                this.communicationService.getQuiz(id).subscribe({
                    next: (quiz) => {
                        console.log(quiz);
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
        if (index !== undefined && index !== null && index >= 0 && index < quiz.questions.length) {
            quiz.questions[index] = question;
        }
    }

    deleteQuestion(index: number, quiz: Quiz) {
        if (index >= 0 && index < quiz.questions.length) {
            quiz.questions.splice(index, 1);
        }
    }

    // TODO: check for deleted quiz while modifying
    saveQuiz(quiz: Quiz) {
        if (this.quizId) {
            this.updateQuizOnServer(this.quizId, quiz);
        } else {
            this.addQuizToServer(quiz);
        }
    }

    /*     setGeneralInfoData(title: string, description: string, duration: number) {
        if (this.newQuiz) {
            this.newQuiz.title = title;
            this.newQuiz.description = description;
            this.newQuiz.duration = duration;
        }
    } */

    // addNewQuiz(quiz: Quiz) {
    //     this.addQuizToServer(quiz);
    // }

    // updateQuiz(id: string, quiz: Quiz) {
    //     this.updateQuizOnServer(id, quiz);
    // }

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

    updateGeneralInfo(quiz: Quiz, title: string, description: string, duration: number) {
        quiz.title = title;
        quiz.description = description;
        quiz.duration = duration;
    }
}
