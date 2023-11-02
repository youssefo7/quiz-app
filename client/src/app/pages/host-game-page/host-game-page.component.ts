import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';

@Component({
    selector: 'app-host-game-page',
    templateUrl: './host-game-page.component.html',
    styleUrls: ['./host-game-page.component.scss'],
})
export class HostGamePageComponent implements OnInit {
    quiz: Quiz | null;
    title: string;

    // All these parameters are needed for the component to work properly
    // eslint-disable-next-line max-params
    constructor(
        private gameService: GameService,
        private popup: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        this.title = 'Partie: ';
    }

    ngOnInit() {
        this.loadQuiz();
    }

    openQuitPopUp() {
        const config: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir quitter la partie? La partie sera terminée pour tous les joueurs.',
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
            this.title += ' (Organisateur)';
        }
    }

    private async leaveGamePage() {
        await this.router.navigateByUrl('/game/new');
    }
}
