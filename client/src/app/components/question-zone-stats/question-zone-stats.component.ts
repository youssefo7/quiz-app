import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ButtonStyle } from '@app/interfaces/button-style';
import { Question, Quiz } from '@app/interfaces/quiz';
import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { QTypes } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { PlayerSubmission } from '@common/player-submission';
import { TimeEvents } from '@common/time.events';
import { Subscription } from 'rxjs';

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
    playersQRLAnswers: PlayerSubmission[];
    isQRLBeingEvaluated: boolean;
    private currentQuestionIndex: number;
    private lastQuestionIndex: number;
    private timeServiceSubscription: Subscription;
    private socketTime: number;
    private shouldEnableNextQuestionButtonAtEndOfTimer: boolean;

    constructor(
        private readonly socketClientService: SocketClientService,
        private chartDataManager: ChartDataManagerService,
    ) {
        this.currentQuestionIndex = 0;
        this.isNextQuestionButtonDisable = true;
        this.nextQuestionButtonText = 'Prochaine Question';
        this.nextQuestionButtonStyle = { backgroundColor: '' };
        this.socketTime = 0;
        this.isQRLBeingEvaluated = false;
        this.playersQRLAnswers = [];
        this.shouldEnableNextQuestionButtonAtEndOfTimer = false;
    }

    async ngOnInit(): Promise<void> {
        if (!this.socketClientService.socketExists()) {
            return;
        }
        this.lastQuestionIndex = this.quiz.questions.length - 1;
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
        this.handleAnswers();
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
                this.shouldEnableNextQuestionButtonAtEndOfTimer = true;
                this.handleEndOfQuestion();
            }
        });
    }

    private handleEndOfQuestion() {
        // TODO: Ça serait peut-être mieux de déplacer le send SaveChartData dans l'event AllPlayersSubmitted
        this.socketClientService.send(GameEvents.SaveChartData, this.roomId);
        if (this.shouldEnableNextQuestionButtonAtEndOfTimer) {
            const buttonStyle: ButtonStyle = { backgroundColor: 'rgb(18, 18, 217)' };
            this.isNextQuestionButtonDisable = false;
            this.nextQuestionButtonStyle = buttonStyle;
        }
    }

    private showNextQuestion() {
        this.isQRLBeingEvaluated = false;
        ++this.currentQuestionIndex;
        this.getQuestion(this.currentQuestionIndex);
    }

    private handleNextQuestion() {
        const buttonStyle: ButtonStyle = { backgroundColor: '' };
        this.socketClientService.on(GameEvents.NextQuestion, () => {
            this.shouldEnableNextQuestionButtonAtEndOfTimer = false;
            this.playersQRLAnswers = [];
            this.isNextQuestionButtonDisable = true;
            this.nextQuestionButtonStyle = buttonStyle;
        });
    }

    private handleAnswers() {
        this.socketClientService.on(GameEvents.AllPlayersSubmitted, () => {
            this.isQRLBeingEvaluated = this.question.type === QTypes.QRL;
            if (this.socketTime !== 0) {
                this.socketClientService.send(TimeEvents.TimerInterrupted, this.roomId);
            }
            if (this.question.type === QTypes.QCM) {
                this.socketClientService.send(GameEvents.GiveBonus, this.roomId);
            }
        });
    }
}
