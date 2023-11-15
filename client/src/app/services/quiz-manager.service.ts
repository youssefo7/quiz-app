import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Choice, Question, Quiz } from '@app/interfaces/quiz';
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

            for (let j = 0; j < this.quizToModify.questions[i].choices.length; j++) {
                if (this.isQuizChoiceModified(this.quizToModify.questions[i].choices[j], quiz.questions[i].choices[j])) {
                    return true;
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
        const isQuestionChoicesLengthDifferent = questionBefore.choices.length !== questionAfter.choices.length;
        const hasQuestionDifferences =
            isQuestionTypeDifferent || isQuestionTextDifferent || isQuestionPointsDifferent || isQuestionChoicesLengthDifferent;
        return hasQuestionDifferences;
    }

    private isQuizChoiceModified(choiceBefore: Choice, choiceAfter: Choice) {
        const isChoiceTextDifferent = choiceBefore.text.trim() !== choiceAfter.text.trim();
        const isChoiceValidDifferent = choiceBefore.isCorrect !== choiceAfter.isCorrect;
        const hasChoiceDifferences = isChoiceTextDifferent || isChoiceValidDifferent;
        return hasChoiceDifferences;
    }
}
