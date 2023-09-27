import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss', '../../../assets/shared.scss'],
})
export class GamePageComponent implements OnInit {
    title: string;
    link: string;
    quiz: Quiz;
    playerPoints: number;
    private readonly isTestGame = this.route.snapshot.url.some((segment) => segment.path === 'test');

    // Raison: J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private communicationService: CommunicationService,
        private route: ActivatedRoute,
        private popup: MatDialog,
        private router: Router,
    ) {
        this.title = 'Partie';
        this.link = '/home';
        this.playerPoints = 0;
    }

    ngOnInit() {
        this.checkGameRoute();
        this.getQuiz();
    }

    checkGameRoute(isTestGame = this.isTestGame) {
        if (isTestGame) {
            this.link = '/game/new';
            this.title += ' - Test';
        }
    }

    getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            this.communicationService.getQuiz(id).subscribe((quiz) => {
                this.quiz = quiz;
            });
        }
    }

    givePoints(points: number) {
        this.playerPoints += points;
    }

    openQuitPopUp() {
        const config: PopupMessageConfig = {
            message: 'Êtes-vous sûr de vouloir quitter la partie?',
            hasCancelButton: true,
            okButtonText: 'Quitter',
            cancelButtonText: 'Annuler',
            okButtonFunction: () => {
                this.router.navigate(['/home']);
            },
        };
        const dialogRef = this.popup.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }
}
