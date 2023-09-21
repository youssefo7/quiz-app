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
    message: BehaviorSubject<string>;
    availableQuizzes: BehaviorSubject<Quiz[]>;
    visibleQuizList: BehaviorSubject<Quiz[]>;
    selectedQuizId: string | null;

    constructor(
        private readonly communicationService: CommunicationService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.getVisibleQuizListFromServer();
        this.message = new BehaviorSubject<string>('');
        this.availableQuizzes = new BehaviorSubject<Quiz[]>([]);
        this.visibleQuizList = new BehaviorSubject<Quiz[]>([]);
        this.selectedQuizId = null;
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
                this.visibleQuizList.next(visibleQuizzes);
            },
            error: (err: HttpErrorResponse) => {
                const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
                this.message.next(responseString);
            },
        });
    }

    // Permet d'afficher les détails d'un seul quiz à la fois
    toggleDetails(id: string): void {
        if (this.selectedQuizId === id) {
            this.selectedQuizId = null;
        } else {
            this.selectedQuizId = id;
        }
    }

    // TODO : Implémenter le pop up et la mise à jour de la liste
    checkCanProceed(quiz: Quiz, toTest: boolean = false): void {
        this.getVisibleQuizListFromServer();
        this.fetchQuizzes();
        const isVisible = this.visibleQuizList.value.some((visibleQuiz) => visibleQuiz.id === quiz.id);
        const isAvailable = this.availableQuizzes.pipe(
            map((availableQuizzes) => availableQuizzes.some((availableQuiz) => availableQuiz.id === quiz.id)),
        );
        if (isAvailable) {
            if (isVisible) {
                if (toTest) {
                    this.router.navigate(['game/', quiz.id, 'test']);
                } else {
                    this.router.navigate(['game/', quiz.id]);
                }
            } else {
                // console.log("Le jeu n'est plus disponible. Veuillez en choisir un autre dans la liste.");
            }
        } else {
            // console.log('Le jeu a été supprimé. Veuillez en choisir un autre dans la liste.');
        }
    }

    // TODO : implémenter popUp
}
