import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { QuizGeneralInfoComponent } from '@app/components/quiz-general-info/quiz-general-info.component';
import { QuizQuestionInfoComponent } from '@app/components/quiz-question-info/quiz-question-info.component';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';
import { BehaviorSubject } from 'rxjs';
@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
})
export class AdminPageComponent implements OnInit {
    @ViewChild(QuizQuestionInfoComponent, { static: false }) quizQuestionInfo: QuizQuestionInfoComponent;
    @ViewChild(QuizGeneralInfoComponent, { static: false }) quizGeneralInfo: QuizGeneralInfoComponent;
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');
    quizzes: BehaviorSubject<Quiz[]> = new BehaviorSubject<Quiz[]>([]);
    selectedQuiz: BehaviorSubject<Quiz | null> = new BehaviorSubject<Quiz | null>(null);
    newQuiz: Quiz;
    questionIndex: number;
    chosenQuiz: Quiz;

    constructor(
        private readonly communicationService: CommunicationService,
        private quizManagerService: NewQuizManagerService,
        private router: Router,
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

    modifyQuiz(quiz: Quiz) {
        const id = quiz.id;
        this.quizManagerService.setQuizToModify(quiz);
        this.router.navigate(['/quiz', id]);
    }
}
