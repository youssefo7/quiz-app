import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { Question, Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-create-quiz-form',
    templateUrl: './create-quiz-form.component.html',
    styleUrls: ['./create-quiz-form.component.scss'],
})
export class CreateQuizFormComponent implements OnInit {
    @Input() questionIndex: number;
    @ViewChild(QuizQuestionInfoComponent, { static: false }) quizQuestionInfo: QuizQuestionInfoComponent;
    @ViewChild('generalInfoForm') generalInfoForm: FormGroup;
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');
    quizzes: BehaviorSubject<Quiz[]> = new BehaviorSubject<Quiz[]>([]);
    selectedQuiz: BehaviorSubject<Quiz | null> = new BehaviorSubject<Quiz | null>(null);
    selectedQuestionIndex: number;
    newQuiz: Quiz;
    selectedQuestion: Question;

    constructor(
        private readonly communicationService: CommunicationService,
        private quizManagerService: NewQuizManagerService,
    ) {}

    ngOnInit(): void {
        this.newQuiz = this.quizManagerService.getNewQuiz();
        this.getQuizListFromServer();
        this.questionIndex = 0;
    }

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

    selectQuestion(selectedIndex: number) {
        this.selectedQuestion = this.newQuiz.questions[selectedIndex];
        this.selectedQuestionIndex = selectedIndex;
        this.quizQuestionInfo.loadQuestionInformation(this.selectedQuestion);
    }

    loadQuestionInformation(selectedQuestion: Question) {
        if (this.quizQuestionInfo) {
            this.quizQuestionInfo.loadQuestionInformation(selectedQuestion);
            this.selectedQuestionIndex = this.newQuiz.questions.findIndex((question) => question === selectedQuestion);
        }
    }

    onQuestionModified(event: { question: Question; index: number }) {
        const modifiedQuestion = event.question;
        const index = event.index;
        const nonValidIndex = -1;
        if (index !== nonValidIndex) {
            if (index < this.newQuiz.questions.length) {
                this.newQuiz.questions[index] = modifiedQuestion;
            }
        }
    }

    isQuizFormValid(): boolean {
        if (
            this.newQuiz.questions.some((question) => this.isQuestionValid(question)) &&
            this.newQuiz.title !== '' &&
            this.newQuiz.description !== '' &&
            this.newQuiz.duration !== 0
        ) {
            return true;
        }
        return false;
    }

    isQuestionValid(question: Question): boolean {
        return (
            question.text.trim().length > 0 &&
            question.type.trim().length > 0 &&
            question.choices.length >= 2 &&
            question.choices.some((choice) => choice.text.trim().length > 0) &&
            question.choices.some((choice) => choice.isCorrect)
        );
    }

    deleteQuestion(index: number): void {
        if (index >= 0 && index < this.newQuiz.questions.length) {
            this.newQuiz.questions.splice(index, 1);
            this.selectedQuestionIndex = -1;
            this.repositionQuestions(index);
            this.quizQuestionInfo.resetForm();
        }
    }

    repositionQuestions(index: number) {
        for (let i = index; i < this.newQuiz.questions.length; i++) {
            this.newQuiz.questions[index] = this.newQuiz.questions[index + 1];
        }
    }
}
