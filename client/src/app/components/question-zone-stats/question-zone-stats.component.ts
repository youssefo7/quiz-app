import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { GameEvents } from '@app/events/game.events';
import { TimeEvents } from '@app/events/time.events';
import { Question, Quiz } from '@app/interfaces/quiz';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Subscription, firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-question-zone-stats',
    templateUrl: './question-zone-stats.component.html',
    styleUrls: ['./question-zone-stats.component.scss'],
})
export class QuestionZoneStatsComponent implements OnInit, OnDestroy {
    @Input() quiz: Quiz;
    @Input() roomId: string;
    question: Question;
    isNextQuestionButtonDisable: boolean;
    nextQuestionButtonText: string;
    nextQuestionButtonStyle: { backgroundColor: string };
    private currentQuestionIndex: number;
    private lastQuestionIndex: number;
    private isEndOfQuestionTime: boolean;
    private timeServiceSubscription: Subscription;
    private submittedQuestionCount: number;
    private playerCount: number;
    private hasTimerBeenInterrupted: boolean;

    constructor(
        private readonly socketClientService: SocketClientService,
        private readonly roomCommunicationService: RoomCommunicationService,
    ) {
        this.currentQuestionIndex = 0;
        this.isNextQuestionButtonDisable = true;
        this.nextQuestionButtonText = 'Prochaine Question';
        this.nextQuestionButtonStyle = { backgroundColor: '' };
        this.isEndOfQuestionTime = false;
        this.hasTimerBeenInterrupted = false;
        this.submittedQuestionCount = 0;
    }

    async ngOnInit() {
        if (!this.socketClientService.socketExists()) {
            return;
        }
        this.setEvents();
        this.playerCount = (await firstValueFrom(this.roomCommunicationService.getRoomPlayers(this.roomId as string))).length;
        this.lastQuestionIndex = this.quiz.questions.length - 1;
    }

    ngOnDestroy() {
        if (this.timeServiceSubscription) this.timeServiceSubscription.unsubscribe();
    }

    goToNextQuestion() {
        if (this.currentQuestionIndex !== this.lastQuestionIndex) {
            this.socketClientService.send(GameEvents.NextQuestion, this.roomId);
        } else {
            this.socketClientService.send(GameEvents.SendResults, this.roomId);
        }
    }

    private reactToNextQuestionEvent() {
        this.socketClientService.on(GameEvents.NextQuestion, () => {
            this.isEndOfQuestionTime = true;
            this.isNextQuestionButtonDisable = true;
            this.nextQuestionButtonStyle = { backgroundColor: '' };
        });
    }

    private async setEvents() {
        this.getQuestion(this.currentQuestionIndex);
        this.enableNextQuestionButton();
        this.reactToNextQuestionEvent();
        this.handleSubmittedQuestion();
        this.handlePlayerLeaveGame();
        this.handleNextQuestion();
    }

    private getQuestion(index: number) {
        if (this.quiz && index < this.quiz.questions.length) {
            this.question = this.quiz.questions[index];
        }
    }

    private enableNextQuestionButton() {
        this.socketClientService.on(TimeEvents.CurrentTimer, (time: number) => {
            this.detectEndOfQuestion(time);
        });

        this.socketClientService.on(TimeEvents.TimerInterrupted, () => {
            this.hasTimerBeenInterrupted = true;
            this.detectEndOfQuestion(0);
        });

        this.socketClientService.on(TimeEvents.TransitionClockFinished, () => {
            this.showNextQuestion();
        });
    }

    private detectEndOfQuestion(time: number) {
        if (time === 0) {
            if (this.submittedQuestionCount >= 1 && !this.hasTimerBeenInterrupted) {
                this.socketClientService.send(GameEvents.GiveBonus, this.roomId);
            } else if (this.hasTimerBeenInterrupted) {
                this.socketClientService.send(GameEvents.GiveBonus, this.roomId);
            }

            this.isEndOfQuestionTime = !this.isEndOfQuestionTime;

            if (this.isEndOfQuestionTime) {
                this.isNextQuestionButtonDisable = false;
                this.nextQuestionButtonStyle = { backgroundColor: 'rgb(18, 18, 217)' };
            }
            this.hasTimerBeenInterrupted = false;
        }
    }

    private showNextQuestion() {
        if (!this.isEndOfQuestionTime && this.quiz) {
            this.currentQuestionIndex++;
            this.getQuestion(this.currentQuestionIndex);
            if (this.currentQuestionIndex === this.lastQuestionIndex) {
                this.nextQuestionButtonText = 'Voir les résultats';
            }
        }
    }

    private handleSubmittedQuestion() {
        this.socketClientService.on(GameEvents.SubmitQuestion, () => {
            this.submittedQuestionCount++;
            if (this.submittedQuestionCount === this.playerCount) {
                this.socketClientService.send(TimeEvents.TimerInterrupted, this.roomId);
            }
        });
    }

    private handleNextQuestion() {
        this.socketClientService.on(GameEvents.NextQuestion, () => {
            this.submittedQuestionCount = 0;
        });
    }

    private handlePlayerLeaveGame() {
        this.socketClientService.on(GameEvents.PlayerLeaveGame, () => {
            this.playerCount--;
        });
    }
}
