import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Question, Quiz } from '@app/interfaces/quiz';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { TimeEvents } from '@common/time.events';
import { firstValueFrom, Subscription } from 'rxjs';

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
    private playerCount: number;
    private hasTimerBeenInterrupted: boolean;
    private socketTime: number;
    private submittedQuestionOnClickCount: number;
    private goodAnswerOnClickCount: number;
    private goodAnswerOnFinishedTimerCount: number;
    private badAnswerOnClickCount: number;
    private badAnswerOnFinishedTimerCount: number;
    private totalBadAnswers: number;
    private totalGoodAnswers: number;

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
        this.socketTime = 0;
        this.submittedQuestionOnClickCount = 0;
        this.goodAnswerOnFinishedTimerCount = 0;
        this.goodAnswerOnClickCount = 0;
        this.badAnswerOnClickCount = 0;
        this.badAnswerOnFinishedTimerCount = 0;
        this.totalBadAnswers = 0;
        this.totalGoodAnswers = 0;
    }

    async ngOnInit() {
        if (!this.socketClientService.socketExists()) {
            return;
        }
        this.lastQuestionIndex = this.quiz.questions.length - 1;
        this.playerCount = (await firstValueFrom(this.roomCommunicationService.getRoomPlayers(this.roomId as string))).length;
        this.setEvents();
    }

    ngOnDestroy() {
        if (this.timeServiceSubscription) {
            this.timeServiceSubscription.unsubscribe();
        }
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

    private setEvents() {
        this.getQuestion(this.currentQuestionIndex);
        this.enableNextQuestionButton();
        this.reactToNextQuestionEvent();
        this.handleSubmittedQuestion();
        this.handlePlayerLeaveGame();
        this.handleNextQuestion();
        this.handleAnswers();
    }

    private getQuestion(index: number) {
        if (this.quiz && index < this.quiz.questions.length) {
            this.question = this.quiz.questions[index];
            if (this.currentQuestionIndex === this.lastQuestionIndex) {
                this.nextQuestionButtonText = 'Voir les résultats';
            }
        }
    }

    private enableNextQuestionButton() {
        this.socketClientService.on(TimeEvents.CurrentTimer, (time: number) => {
            this.detectEndOfQuestion(time);
            this.socketTime = time;
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
            const allPlayersSubmitted = this.submittedQuestionOnClickCount === this.playerCount;
            if (this.hasTimerBeenInterrupted && allPlayersSubmitted) {
                this.socketClientService.send(GameEvents.GiveBonus, this.roomId);
            } else {
                this.totalGoodAnswers = this.goodAnswerOnClickCount + this.goodAnswerOnFinishedTimerCount;
                this.totalBadAnswers = this.badAnswerOnClickCount + this.badAnswerOnFinishedTimerCount;
                const totalPlayersAnswers = this.totalGoodAnswers + this.totalBadAnswers;
                if (totalPlayersAnswers === this.playerCount) {
                    if (this.goodAnswerOnClickCount >= 1) {
                        this.socketClientService.send(GameEvents.GiveBonus, this.roomId);
                    } else if (this.goodAnswerOnFinishedTimerCount === 1) {
                        this.socketClientService.send(GameEvents.GiveBonus, this.roomId);
                    }
                }
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
            this.resetAnswerCount();
            this.getQuestion(this.currentQuestionIndex);
        }
    }

    private resetAnswerCount() {
        this.submittedQuestionOnClickCount = 0;
        this.goodAnswerOnFinishedTimerCount = 0;
        this.goodAnswerOnClickCount = 0;
        this.badAnswerOnClickCount = 0;
        this.badAnswerOnFinishedTimerCount = 0;
        this.totalBadAnswers = 0;
        this.totalGoodAnswers = 0;
    }

    private handleSubmittedQuestion() {
        this.socketClientService.on(GameEvents.SubmitQuestionOnClick, () => {
            this.submittedQuestionOnClickCount++;
        });
    }

    private handleNextQuestion() {
        this.socketClientService.on(GameEvents.NextQuestion, () => {
            this.submittedQuestionOnClickCount = 0;
        });
    }

    private handlePlayerLeaveGame() {
        this.socketClientService.on(GameEvents.PlayerLeaveGame, () => {
            this.playerCount--;
        });
    }

    private handleAnswers() {
        this.socketClientService.on(GameEvents.GoodAnswerOnClick, () => {
            this.goodAnswerOnClickCount++;
            this.detectIfAllPlayersSubmitted();
        });

        this.socketClientService.on(GameEvents.GoodAnswerOnFinishedTimer, () => {
            this.goodAnswerOnFinishedTimerCount++;
            this.detectIfAllPlayersSubmitted();
        });

        this.socketClientService.on(GameEvents.BadAnswerOnClick, () => {
            this.badAnswerOnClickCount++;
            this.detectIfAllPlayersSubmitted();
        });

        this.socketClientService.on(GameEvents.BadAnswerOnFinishedTimer, () => {
            this.badAnswerOnFinishedTimerCount++;
            this.detectIfAllPlayersSubmitted();
        });
    }

    private detectIfAllPlayersSubmitted() {
        const allPlayersSubmitted = this.submittedQuestionOnClickCount === this.playerCount;
        if (allPlayersSubmitted && this.socketTime !== 0) {
            this.socketClientService.send(TimeEvents.TimerInterrupted, this.roomId);
        } else {
            this.detectEndOfQuestion(0);
        }
    }
}
