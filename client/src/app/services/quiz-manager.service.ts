import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Question, Quiz, Choice } from '@app/interfaces/quiz';
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

    saveQuiz(quiz: Quiz) {
        if (quiz.id !== '') {
            this.updateQuizOnServer(quiz.id, quiz);
        } else {
            this.addQuizToServer(quiz);
        }
    }

    moveQuestionUp(index: number, quiz: Quiz) {
        const canMoveUp = index > 0 && index < quiz.questions.length;
        if (canMoveUp) {
            const tmp = quiz.questions[index - 1];
            quiz.questions[index - 1] = quiz.questions[index];
            quiz.questions[index] = tmp;
        }
    }

    moveQuestionDown(index: number, quiz: Quiz) {
        const canMoveDown = index < quiz.questions.length - 1 && index >= 0;
        if (canMoveDown) {
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
        if (this.isQuizModified(this.quizToModify, quiz)) {
            return true;
        }

        const isQuestionCountDifferent = this.quizToModify.questions.length !== quiz.questions.length;
        if (isQuestionCountDifferent) {
            return true;
        }

        for (let i = 0; i < this.quizToModify.questions.length; i++) {
            if (this.isQuizQuestionsModified(this.quizToModify.questions[i], quiz.questions[i])) {
                return true;
            }

            for (let j = 0; j < this.quizToModify.questions[i].choices.length; j++) {
                if (this.isQuizChoicesModified(this.quizToModify.questions[i].choices[j], quiz.questions[i].choices[j])) {
                    return true;
                }
            }
        }
        return false;
    }

    private isValidIndex(index: number, quiz: Quiz): boolean {
        return index >= 0 && index < quiz.questions.length;
    }

    private isQuizModified(quizBefore: Quiz, quizAfter: Quiz): boolean {
        const isQuizTitleDifferent = quizBefore.title.trim() !== quizAfter.title.trim();
        const isQuizDescriptionDifferent = quizBefore.description.trim() !== quizAfter.description.trim();
        const isQuizDurationDifferent = quizBefore.duration !== quizAfter.duration;
        if (isQuizTitleDifferent || isQuizDescriptionDifferent || isQuizDurationDifferent) {
            return true;
        }
        return false;
    }

    private isQuizQuestionsModified(questionBefore: Question, questionAfter: Question): boolean {
        const isQuestionTypeDifferent = questionBefore.type !== questionAfter.type;
        const isQuestionTextDifferent = questionBefore.text.trim() !== questionAfter.text.trim();
        const isQuestionPointsDifferent = questionBefore.points !== questionAfter.points;
        const isQuesiontChoicesDifferent = questionBefore.choices.length !== questionAfter.choices.length;
        if (isQuestionTypeDifferent || isQuestionTextDifferent || isQuestionPointsDifferent || isQuesiontChoicesDifferent) {
            return true;
        }
        return false;
    }

    private isQuizChoicesModified(choiceBefore: Choice, choiceAfter: Choice): boolean {
        const isChoicesTextDifferent = choiceBefore.text.trim() !== choiceAfter.text.trim();
        const isChoicesValidDifferent = choiceBefore.isCorrect !== choiceAfter.isCorrect;
        if (isChoicesTextDifferent || isChoicesValidDifferent) {
            return true;
        }
        return false;
    }
}
