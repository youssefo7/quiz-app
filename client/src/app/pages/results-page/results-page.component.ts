import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionZoneStatsComponent } from '@app/components/question-zone-stats/question-zone-stats.component';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { Chart } from 'chart.js';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-results-page',
    templateUrl: './results-page.component.html',
    styleUrls: ['./results-page.component.scss', '../../../assets/shared.scss'],
})
export class ResultsPageComponent implements OnInit, OnDestroy {
    @ViewChild(QuestionZoneStatsComponent, { static: false }) questionZoneStats: QuestionZoneStatsComponent;

    roomId: string;
    quiz: Quiz;
    title: string;
    chart: Chart[];
    private isHost: boolean;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private socketClientService: SocketClientService,
        private communicationService: CommunicationService,
    ) {
        this.roomId = this.route.snapshot.paramMap.get('roomId') as string;
        this.title = 'Résultats';
        this.isHost = this.router.url.endsWith('/host');
    }

    @HostListener('window:beforeunload', ['$event'])
    beforeUnloadHandler() {
        this.handleNavigation();
    }

    ngOnDestroy() {
        this.handleNavigation();
    }

    handleNavigation() {
        if (this.isHost) {
            this.socketClientService.send(GameEvents.EndGame, { roomId: this.roomId, gameAborted: false });
            this.socketClientService.disconnect();
        } else {
            this.socketClientService.send(GameEvents.PlayerLeaveGame, { roomId: this.roomId, isInGame: false });
            this.socketClientService.disconnect();
        }
    }

    async ngOnInit() {
        if (!this.socketClientService.socketExists()) {
            this.socketClientService.connect();
            if (this.socketClientService.socketExists()) {
                if (this.isHost) {
                    this.socketClientService.send(GameEvents.EndGame, { roomId: this.roomId, gameAborted: false });
                } else {
                    this.socketClientService.send(GameEvents.PlayerLeaveGame, { roomId: this.roomId, isInGame: false });
                }
                this.socketClientService.disconnect();
            }
            this.router.navigateByUrl('home/');
            return;
        }

        const quizId = this.route.snapshot.paramMap.get('quizId');
        if (quizId) {
            this.quiz = await firstValueFrom(this.communicationService.getQuiz(quizId));
        }
    }
}
