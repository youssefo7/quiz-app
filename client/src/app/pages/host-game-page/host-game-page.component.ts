import { Component, ElementRef, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-host-game-page',
    templateUrl: './host-game-page.component.html',
    styleUrls: ['./host-game-page.component.scss'],
})
export class HostGamePageComponent implements OnInit {
    quiz: Quiz;
    title: string;

    // All these parameters are needed for the component to work properly
    // eslint-disable-next-line max-params
    constructor(
        private popup: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly elementRef: ElementRef,
        private readonly communicationService: CommunicationService,
    ) {
        this.title = 'Partie: ';
    }

    // TODO : deconnecter lors de refresh
    // @HostListener('window:beforeunload', ['$event'])
    // unloadNotification($event: BeforeUnloadEvent): void {
    //     $event.returnValue = false;
    //     this.leaveGamePage();
    // }

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

    getQuizTitle() {
        if (this.quiz) {
            this.title += this.quiz.title;
            this.title += ' (Organisateur)';
            this.elementRef.nativeElement.setAttribute('title', this.title);
        }
    }

    private async loadQuiz() {
        await this.getQuiz();
        this.getQuizTitle();
    }

    private async getQuiz() {
        const id = this.route.snapshot.paramMap.get('id') as string;
        const quiz = await firstValueFrom(this.communicationService.getQuiz(id));
        this.quiz = quiz;
    }
    private async leaveGamePage() {
        await this.router.navigateByUrl('/game/new');
    }
}
