// La raison du disable est puisque dans la méthode hasQuizBeenModified, il y a beaucoup de vérifications imbriquées qui doivent être fait
// et la complexité de celui-ci est élevée.
/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Question, Quiz } from '@app/interfaces/quiz';
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

    getQuizListFromServer(): void {
        this.communicationService.getQuizzes().subscribe({
            next: (quizzes) => {
                this.quizzes = quizzes;
            },
        });
    }

    addQuizToServer(newQuiz: Quiz) {
        this.communicationService.addQuiz(newQuiz).subscribe({
            next: () => {
                this.router.navigateByUrl('admin');
            },
        });
    }

    updateQuizOnServer(id: string, updatedQuiz: Quiz) {
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
                        this.quizToModify = JSON.parse(JSON.stringify(quiz));
                        resolve(quiz);
                    },
                });
            });
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

    saveQuiz(quiz: Quiz) {
        if (quiz.id !== '') {
            this.updateQuizOnServer(quiz.id, quiz);
        } else {
            this.addQuizToServer(quiz);
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
                this.quizToModify.questions[i].points !== quiz.questions[i].points
            ) {
                return true;
            }
            const thisChoices = this.quizToModify.questions[i].choices || [];
            const quizChoices = quiz.questions[i].choices || [];

            if (thisChoices.length !== quizChoices.length) {
                return true;
            }

            for (let j = 0; j < thisChoices.length; j++) {
                const currentChoice = thisChoices[j];
                const quizChoice = quizChoices[j];

                const currentChoiceNotModified = (currentChoice && !quizChoice) || (!currentChoice && quizChoice);
                const currentChoiceExists = currentChoice && quizChoice;
                const currentChoiceIsDifferent =
                    currentChoice.text.trim() !== quizChoice.text.trim() || currentChoice.isCorrect !== quizChoice.isCorrect;
                const currentChoiceExistsAndIsDifferent = currentChoiceExists && currentChoiceIsDifferent;

                if (currentChoiceNotModified || currentChoiceExistsAndIsDifferent) {
                    return true;
                }
            }
        }

        return false;
    }
}
