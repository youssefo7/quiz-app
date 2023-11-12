import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Question, Quiz } from '@app/interfaces/quiz';
import { firstValueFrom } from 'rxjs';
import { CommunicationService } from './communication.service';

@Injectable({
    providedIn: 'root',
})
export class QuizManagerService {
    quizzes: Quiz[];
    isModifiedQuestion: boolean;
    modifiedIndex: number;
    quizToModify: Quiz;

    constructor(
        private readonly communicationService: CommunicationService,
        private router: Router,
    ) {
        this.getQuizListFromServer();
        this.isModifiedQuestion = false;
    }

    // On garde l'utilisation du subscribe (au lieu d'un firstValueFrom) étant donné
    // que le constructeur ne peut pas être async
    getQuizListFromServer() {
        this.communicationService.getQuizzes().subscribe({
            next: (quizzes) => {
                this.quizzes = quizzes;
            },
        });
    }

    async addQuizToServer(newQuiz: Quiz): Promise<void> {
        await firstValueFrom(this.communicationService.addQuiz(newQuiz));
        this.router.navigateByUrl('admin');
    }

    async updateQuizOnServer(id: string, updatedQuiz: Quiz): Promise<void> {
        try {
            await firstValueFrom(this.communicationService.updateQuiz(id, updatedQuiz));
            this.router.navigateByUrl('admin');
        } catch (error) {
            await this.addQuizToServer(updatedQuiz);
        }
    }

    async fetchQuiz(id: string | null): Promise<Quiz | undefined> {
        if (id) {
            const quiz = await firstValueFrom(this.communicationService.getQuiz(id));
            this.quizToModify = JSON.parse(JSON.stringify(quiz));
            return quiz;
        }
        return undefined;
    }

    addNewQuestion(newQuestion: Question, quiz: Quiz) {
        quiz.questions.push(newQuestion);
    }

    modifyQuestion(question: Question, index: number, quiz: Quiz) {
        if (index >= 0 && index < quiz.questions.length) {
            quiz.questions[index] = question;
        }
        this.isModifiedQuestion = false;
    }

    deleteQuestion(index: number, quiz: Quiz) {
        if (index >= 0 && index < quiz.questions.length) {
            quiz.questions.splice(index, 1);
        }
    }

    async saveQuiz(quiz: Quiz): Promise<void> {
        if (quiz.id !== '') {
            await this.updateQuizOnServer(quiz.id, quiz);
        } else {
            await this.addQuizToServer(quiz);
        }
    }

    moveQuestionUp(index: number, quiz: Quiz) {
        if (index > 0 && index < quiz.questions.length) {
            const tmp = quiz.questions[index - 1];
            quiz.questions[index - 1] = quiz.questions[index];
            quiz.questions[index] = tmp;
        }
    }

    moveQuestionDown(index: number, quiz: Quiz) {
        if (index < quiz.questions.length - 1 && index >= 0) {
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

    hasQuizBeenModified(quiz: Quiz): boolean {
        if (
            this.quizToModify.title.trim() !== quiz.title.trim() ||
            this.quizToModify.description.trim() !== quiz.description.trim() ||
            this.quizToModify.duration !== quiz.duration
        ) {
            return true;
        }

        if (this.quizToModify.questions.length !== quiz.questions.length) {
            return true;
        }

        for (let i = 0; i < this.quizToModify.questions.length; i++) {
            if (
                this.quizToModify.questions[i].type !== quiz.questions[i].type ||
                this.quizToModify.questions[i].text.trim() !== quiz.questions[i].text.trim() ||
                this.quizToModify.questions[i].points !== quiz.questions[i].points ||
                this.quizToModify.questions[i].choices.length !== quiz.questions[i].choices.length
            ) {
                return true;
            }

            for (let j = 0; j < this.quizToModify.questions[i].choices.length; j++) {
                if (
                    this.quizToModify.questions[i].choices[j].text.trim() !== quiz.questions[i].choices[j].text.trim() ||
                    this.quizToModify.questions[i].choices[j].isCorrect !== quiz.questions[i].choices[j].isCorrect
                ) {
                    return true;
                }
            }
        }
        return false;
    }
}
