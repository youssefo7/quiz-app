import { Component, ElementRef, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { GameEvents } from '@app/events/game.events';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';
import { SocketClientService } from '@app/services/socket-client.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss', '../../../assets/shared.scss'],
})
export class GamePageComponent implements OnInit {
    title: string;
    quiz: Quiz | null;
    playerPoints: number;
    private readonly isTestGame: boolean;

    // Raison: J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private gameService: GameService,
        private popup: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly elementRef: ElementRef,
        private readonly socketClientService: SocketClientService,
    ) {
        this.title = 'Partie: ';
        this.playerPoints = 0;
        this.isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
    }

    ngOnInit() {
        this.loadQuiz();
    }

    async loadQuiz() {
        await this.getQuiz();
        this.getQuizTitle();
        if (!this.isTestGame) {
            this.reactToShowResultsEvent();
        }
    }

    async getQuiz() {
        const quizId = this.route.snapshot.paramMap.get('quizId');
        this.quiz = await this.gameService.getQuizById(quizId);
    }

    getQuizTitle() {
        if (this.quiz) {
            this.title += this.quiz.title;
            this.title += this.isTestGame ? ' (Test)' : '';
            this.elementRef.nativeElement.setAttribute('title', this.title);
        }
    }

    async leaveGamePage() {
        await this.router.navigateByUrl(this.isTestGame ? '/game/new' : '/home');
    }

    givePoints(points: number) {
        this.playerPoints += points;
    }

    openQuitPopUp() {
        const config: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir quitter la partie? Vous ne pourrez plus rejoindre cette partie.',
            hasCancelButton: true,
            okButtonText: 'Quitter',
            okButtonFunction: () => {
                this.leaveGamePage();
            },
        };
        const dialogRef = this.popup.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    private reactToShowResultsEvent() {
        this.socketClientService.on(GameEvents.ShowResults, () => {
            // TODO: changer pour la page de résultat
            this.router.navigateByUrl('/home');
        });
    }
}
