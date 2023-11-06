import { Component, ElementRef, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { GameEvents } from '@app/events/game.events';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { Quiz } from '@app/interfaces/quiz';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';

@Component({
    selector: 'app-host-game-page',
    templateUrl: './host-game-page.component.html',
    styleUrls: ['./host-game-page.component.scss', '../../../assets/shared.scss'],
})
export class HostGamePageComponent implements OnInit {
    quiz: Quiz;
    title: string;
    roomId: string;

    // Raison: J'injecte les services nécessaire dans mon constructeur
    // eslint-disable-next-line max-params
    constructor(
        private popup: MatDialog,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly elementRef: ElementRef,
        private readonly socketClientService: SocketClientService,
    ) {
        this.title = 'Partie: ';
    }

    // TODO : deconnecter lors de refresh
    // @HostListener('window:beforeunload', ['$event'])
    // unloadNotification($event: BeforeUnloadEvent): void {
    //     $event.returnValue = false;
    //     this.leaveGamePage();
    // }

    async ngOnInit() {
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

    private reactToShowResultsEvent() {
        this.socketClientService.on(GameEvents.ShowResults, () => {
            // TODO: changer pour la page de résultat
            this.router.navigateByUrl('/home');
        });
    }

    private async loadQuiz() {
        await this.getQuiz();
        this.getQuizTitle();
        this.reactToShowResultsEvent();
    }

    private async getQuiz() {
        this.roomId = this.route.snapshot.paramMap.get('roomId') as string;
        this.quiz = await firstValueFrom(this.roomCommunicationService.getRoomQuiz(this.roomId));
    }

    private async leaveGamePage() {
        await this.router.navigateByUrl('/game/new');
    }
}
