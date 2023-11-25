import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ButtonStyle } from '@app/interfaces/button-style';
import { Question, Quiz } from '@app/interfaces/quiz';
import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { QTypes } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { QRLAnswer } from '@common/qrl-answer';
import { TimeEvents } from '@common/time.events';
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
    nextQuestionButtonStyle: ButtonStyle;
    playersQRLAnswers: QRLAnswer[];
    isQRLBeingEvaluated: boolean;
    private currentQuestionIndex: number;
    private lastQuestionIndex: number;
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
    private shouldEnableNextQuestionButtonAtEndOfTimer: boolean;

    constructor(
        private readonly socketClientService: SocketClientService,
        private readonly roomCommunicationService: RoomCommunicationService,
        private chartDataManager: ChartDataManagerService,
    ) {
        this.currentQuestionIndex = 0;
        this.isNextQuestionButtonDisable = true;
        this.nextQuestionButtonText = 'Prochaine Question';
        this.nextQuestionButtonStyle = { backgroundColor: '' };
        this.hasTimerBeenInterrupted = false;
        this.socketTime = 0;
        this.submittedQuestionOnClickCount = 0;
        this.goodAnswerOnFinishedTimerCount = 0;
        this.goodAnswerOnClickCount = 0;
        this.badAnswerOnClickCount = 0;
        this.badAnswerOnFinishedTimerCount = 0;
        this.totalBadAnswers = 0;
        this.totalGoodAnswers = 0;
        this.isQRLBeingEvaluated = false;
        this.playersQRLAnswers = [];
        this.shouldEnableNextQuestionButtonAtEndOfTimer = false;
    }

    async ngOnInit(): Promise<void> {
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
            this.isQRLBeingEvaluated = false;
            this.socketClientService.send(GameEvents.NextQuestion, this.roomId);
        } else {
            this.chartDataManager.sendChartData(this.roomId);
            this.socketClientService.send(GameEvents.SendResults, this.roomId);
        }
    }

    enableNextQuestionButtonOnEvaluationEnd() {
        const buttonStyle: ButtonStyle = { backgroundColor: 'rgb(18, 18, 217)' };
        this.isNextQuestionButtonDisable = false;
        this.nextQuestionButtonStyle = buttonStyle;
    }

    private setEvents() {
        this.getQuestion(this.currentQuestionIndex);
        this.handleTimerEvents();
        this.handleNextQuestion();
        this.handleSubmittedQuestion();
        this.handlePlayerLeaveGame();
        this.handleAnswers();
        this.handleUnSubmitQuestion();
    }

    private getQuestion(currentIndex: number) {
        if (currentIndex < this.quiz.questions.length) {
            this.question = this.quiz.questions[currentIndex];
            if (currentIndex === this.lastQuestionIndex) {
                this.nextQuestionButtonText = 'Présenter les résultats';
            }
        }
    }

    private handleTimerEvents() {
        this.socketClientService.on(TimeEvents.CurrentTimer, (time: number) => {
            this.socketTime = time;
        });

        this.socketClientService.on(TimeEvents.TimerFinished, (isTransitionTimer: boolean) => {
            if (this.question.type === QTypes.QCM && !isTransitionTimer) {
                this.shouldEnableNextQuestionButtonAtEndOfTimer = true;
                this.handleEndOfQuestion();
            } else if (isTransitionTimer) {
                this.showNextQuestion();
            }
        });

        this.socketClientService.on(TimeEvents.TimerInterrupted, () => {
            if (this.question.type === QTypes.QCM) {
                this.hasTimerBeenInterrupted = true;
                this.shouldEnableNextQuestionButtonAtEndOfTimer = true;
                this.handleEndOfQuestion();
            }
        });
    }

    private handleEndOfQuestion() {
        if (this.hasTimerBeenInterrupted) {
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

        if (this.shouldEnableNextQuestionButtonAtEndOfTimer) {
            const buttonStyle: ButtonStyle = { backgroundColor: 'rgb(18, 18, 217)' };
            this.isNextQuestionButtonDisable = false;
            this.nextQuestionButtonStyle = buttonStyle;
        }
    }

    private showNextQuestion() {
        this.resetAnswerCount();
        ++this.currentQuestionIndex;
        this.getQuestion(this.currentQuestionIndex);
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

    private handleNextQuestion() {
        const buttonStyle: ButtonStyle = { backgroundColor: '' };
        this.socketClientService.on(GameEvents.NextQuestion, () => {
            this.shouldEnableNextQuestionButtonAtEndOfTimer = false;
            this.submittedQuestionOnClickCount = 0;
            this.playersQRLAnswers = [];
            this.isNextQuestionButtonDisable = true;
            this.nextQuestionButtonStyle = buttonStyle;
            this.hasTimerBeenInterrupted = false;
        });
    }

    private handleSubmittedQuestion() {
        this.socketClientService.on(GameEvents.SubmitQuestionOnClick, () => {
            this.submittedQuestionOnClickCount++;
        });
    }

    private handlePlayerLeaveGame() {
        this.socketClientService.on(GameEvents.PlayerAbandonedGame, () => {
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

        this.socketClientService.on(GameEvents.SubmitQRL, (data: QRLAnswer) => {
            this.playersQRLAnswers.push(data);
        });

        this.socketClientService.on(GameEvents.AllSubmissionReceived, () => {
            this.isQRLBeingEvaluated = true;
            if (this.socketTime !== 0) {
                this.socketClientService.send(TimeEvents.TimerInterrupted, this.roomId);
            }
        });
    }

    private detectIfAllPlayersSubmitted() {
        const allPlayersSubmitted = this.submittedQuestionOnClickCount === this.playerCount;
        if (allPlayersSubmitted && this.socketTime !== 0) {
            this.socketClientService.send(TimeEvents.TimerInterrupted, this.roomId);
        } else if (this.socketTime === 0) {
            this.handleEndOfQuestion();
        }
    }

    private handleUnSubmitQuestion() {
        this.socketClientService.on(GameEvents.UnSubmitAnswer, () => {
            this.submittedQuestionOnClickCount--;
            this.goodAnswerOnClickCount--;
            this.detectIfAllPlayersSubmitted();
        });
    }
}
