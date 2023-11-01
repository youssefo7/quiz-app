import { Component, ElementRef, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss', '../../../assets/shared.scss'],
})
export class GamePageComponent implements OnInit {
    title: string;
    playerPoints: number;
    private quiz: Quiz | null;
    private readonly isTestGame: boolean;

    // We need all these parameters for the constructor to work
    // eslint-disable-next-line max-params
    constructor(
        private gameService: GameService,
        private popup: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly elementRef: ElementRef,
    ) {
        this.title = 'Partie: ';
        this.playerPoints = 0;
        this.isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');
    }

    ngOnInit() {
        this.loadQuiz();
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

    private async loadQuiz() {
        await this.getQuiz();
        this.getQuizTitle();
    }

    private async getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');
        this.quiz = await this.gameService.getQuizById(id);
    }

    private getQuizTitle() {
        if (this.quiz) {
            this.title += this.quiz.title;
            this.title += this.isTestGame ? ' (Test)' : '';
            this.elementRef.nativeElement.setAttribute('title', this.title);
        }
    }

    private async leaveGamePage() {
        await this.router.navigateByUrl(this.isTestGame ? '/game/new' : '/home');
    }
}
