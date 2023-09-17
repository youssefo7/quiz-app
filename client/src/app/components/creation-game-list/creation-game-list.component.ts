import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-creation-game-list',
    templateUrl: './creation-game-list.component.html',
    styleUrls: ['./creation-game-list.component.scss'],
})
export class CreationGameListComponent implements OnInit {
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');
    quizzes: BehaviorSubject<Quiz[]> = new BehaviorSubject<Quiz[]>([]);
    selectedQuiz: BehaviorSubject<Quiz | null> = new BehaviorSubject<Quiz | null>(null);
    selectedQuizId: string | null = null;
    quizToTest: Quiz;
    quizToPlay: Quiz;

    constructor(private readonly communicationService: CommunicationService) {}

    ngOnInit(): void {
        this.getVisibleQuizListFromServer();
    }

    getVisibleQuizListFromServer(): void {
        this.communicationService.getQuizzes().subscribe({
            next: (quizzes) => {
                const visibleQuizzes = quizzes.filter((quiz) => quiz.visibility === true);
                this.quizzes.next(visibleQuizzes);
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message.next(responseString);
            },
        });
    }

    toggleDetails(id: string): void {
        if (this.selectedQuizId === id) {
            this.selectedQuizId = null;
        } else {
            this.selectedQuizId = id;
        }
    }

    testQuiz(quiz: Quiz): void {
        this.quizToTest = quiz;
    }

    createGame(quiz: Quiz): void {
        this.quizToPlay = quiz;
    }
}
