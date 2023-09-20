import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { BehaviorSubject, map } from 'rxjs';

@Component({
    selector: 'app-create-game-list',
    templateUrl: './create-game-list.component.html',
    styleUrls: ['./create-game-list.component.scss'],
})
export class CreateGameListComponent implements OnInit {
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');
    availableQuizzes: BehaviorSubject<Quiz[]> = new BehaviorSubject<Quiz[]>([]);
    quizzes: BehaviorSubject<Quiz[]> = new BehaviorSubject<Quiz[]>([]);
    selectedQuiz: BehaviorSubject<Quiz | null> = new BehaviorSubject<Quiz | null>(null);
    selectedQuizId: string | null = null;
    quizToPlay: Quiz;
    available: Quiz[] = [];
    popUpMessage: string | null = null;

    constructor(
        private readonly communicationService: CommunicationService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.getVisibleQuizListFromServer();
    }

    fetchQuizzes(): void {
        this.communicationService.getQuizzes().subscribe((available) => {
            this.availableQuizzes.next(available);
        });
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

    action(quiz: Quiz): void {
        this.getVisibleQuizListFromServer();
        this.fetchQuizzes();
        const isVisibleQuiz = this.quizzes.value.some((visibleQuiz) => visibleQuiz.id === quiz.id);
        const isAvailable = this.availableQuizzes.pipe(
            map((availableQuizzes) => availableQuizzes.some((availableQuiz) => availableQuiz.id === quiz.id)),
        );
        if (isAvailable) {
            if (isVisibleQuiz) {
                this.router.navigate(['game/', quiz.id, '/test']);
            } else {
                this.popUp("le jeu n'est plus visible");
                this.ngOnInit();
            }
        } else {
            this.popUp("le jeu n'est plus disponible");
            this.ngOnInit();
        }
    }

    popUp(message: string): void {
        // TODO
        this.popUpMessage = message;
    }

    closePopUp(): void {
        this.popUpMessage = null;
    }
}
