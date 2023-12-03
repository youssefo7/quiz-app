// La raison du disable est puisque dans la méthode hasQuizBeenModified, il y a beaucoup de vérifications imbriquées qui doivent être fait
// et la complexité de celui-ci est élevée.
/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Choice, Question, Quiz } from '@app/interfaces/quiz';
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
        if (this.isValidIndex(index, quiz)) {
            quiz.questions[index] = question;
        }
        this.isModifiedQuestion = false;
    }

    deleteQuestion(index: number, quiz: Quiz) {
        if (this.isValidIndex(index, quiz)) {
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
        const canMoveUp = index > 0 && index < quiz.questions.length;
        if (canMoveUp) {
            const tmp = quiz.questions[index - 1];
            quiz.questions[index - 1] = quiz.questions[index];
            quiz.questions[index] = tmp;

            if (index === this.modifiedIndex) {
                this.modifiedIndex--;
            } else if (index - 1 === this.modifiedIndex) {
                this.modifiedIndex++;
            }
        }
    }

    moveQuestionDown(index: number, quiz: Quiz) {
        const canMoveDown = index < quiz.questions.length - 1 && index >= 0;
        if (canMoveDown) {
            const tmp = quiz.questions[index + 1];
            quiz.questions[index + 1] = quiz.questions[index];
            quiz.questions[index] = tmp;

            if (index === this.modifiedIndex) {
                this.modifiedIndex++;
            } else if (index + 1 === this.modifiedIndex) {
                this.modifiedIndex--;
            }
        }
    }

    updateGeneralInfo(quiz: Quiz, generalInfoForm: FormGroup) {
        quiz.title = generalInfoForm.value.title;
        quiz.description = generalInfoForm.value.description;
        quiz.duration = generalInfoForm.value.duration;
    }

    hasQuizBeenModified(quiz: Quiz): boolean {
        if (this.isGeneralInfoModified(this.quizToModify, quiz)) {
            return true;
        }

        if (this.quizToModify.questions.length !== quiz.questions.length) {
            return true;
        }

        for (let i = 0; i < this.quizToModify.questions.length; i++) {
            if (this.isQuizQuestionModified(this.quizToModify.questions[i], quiz.questions[i])) {
                return true;
            }
            const initialChoices = this.quizToModify.questions[i].choices || undefined;
            const quizChoices = quiz.questions[i].choices || undefined;

            if (initialChoices && quizChoices) {
                if (initialChoices.length !== quizChoices.length) {
                    return true;
                }

                for (let j = 0; j < initialChoices.length; j++) {
                    const initialChoice = initialChoices[j];
                    const quizChoice = quizChoices[j];

                    if (this.isQuizChoiceModified(initialChoice, quizChoice)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private isValidIndex(index: number, quiz: Quiz) {
        return index >= 0 && index < quiz.questions.length;
    }

    private isGeneralInfoModified(quizBefore: Quiz, quizAfter: Quiz) {
        const isQuizTitleDifferent = quizBefore.title.trim() !== quizAfter.title.trim();
        const isQuizDescriptionDifferent = quizBefore.description.trim() !== quizAfter.description.trim();
        const isQuizDurationDifferent = quizBefore.duration !== quizAfter.duration;
        const hasQuizDifferences = isQuizTitleDifferent || isQuizDescriptionDifferent || isQuizDurationDifferent;
        return hasQuizDifferences;
    }

    private isQuizQuestionModified(questionBefore: Question, questionAfter: Question) {
        const isQuestionTypeDifferent = questionBefore.type !== questionAfter.type;
        const isQuestionTextDifferent = questionBefore.text.trim() !== questionAfter.text.trim();
        const isQuestionPointsDifferent = questionBefore.points !== questionAfter.points;
        const hasQuestionDifferences = isQuestionTypeDifferent || isQuestionTextDifferent || isQuestionPointsDifferent;
        return hasQuestionDifferences;
    }

    private isQuizChoiceModified(choiceBefore: Choice, choiceAfter: Choice) {
        const isChoiceTextDifferent = choiceBefore.text.trim() !== choiceAfter.text.trim();
        const isChoiceValidDifferent = choiceBefore.isCorrect !== choiceAfter.isCorrect;
        const hasChoiceDifferences = isChoiceTextDifferent || isChoiceValidDifferent;
        return hasChoiceDifferences;
    }
}
