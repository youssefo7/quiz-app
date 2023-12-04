import { Component, Input, OnInit } from '@angular/core';
import { Question, Quiz } from '@app/interfaces/quiz';
import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { QTypes } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { PlayerSubmission } from '@common/player-submission';
import { TimeEvents } from '@common/time.events';

@Component({
    selector: 'app-question-zone-stats',
    templateUrl: './question-zone-stats.component.html',
    styleUrls: ['./question-zone-stats.component.scss'],
})
export class QuestionZoneStatsComponent implements OnInit {
    @Input() quiz: Quiz;
    @Input() roomId: string;
    question: Question;
    isNextQuestionButtonDisable: boolean;
    nextQuestionButtonText: string;
    playersQRLAnswers: PlayerSubmission[];
    isQRLBeingEvaluated: boolean;
    currentQuestionIndex: number;
    private lastQuestionIndex: number;
    private socketTime: number;
    private shouldEnableNextQuestionButtonAtEndOfTimer: boolean;

    constructor(
        private readonly socketClientService: SocketClientService,
        private chartDataManager: ChartDataManagerService,
    ) {
        this.currentQuestionIndex = 0;
        this.isNextQuestionButtonDisable = true;
        this.nextQuestionButtonText = 'Prochaine Question';
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

    async goToNextQuestion() {
        if (this.currentQuestionIndex !== this.lastQuestionIndex) {
            this.socketClientService.send(GameEvents.NextQuestion, this.roomId);
        } else {
            await this.chartDataManager.sendChartData(this.roomId);
            this.socketClientService.send(GameEvents.SendResults, this.roomId);
        }
    }

    enableNextQuestionButton() {
        this.isNextQuestionButtonDisable = false;
    }

    private setEvents() {
        this.getQuestion(this.currentQuestionIndex);
        this.handleTimerEvents();
        this.handleNextQuestion();
        this.handleSubmittedAnswers();
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
        this.socketClientService.send(GameEvents.SaveChartData, this.roomId);
        if (this.shouldEnableNextQuestionButtonAtEndOfTimer) {
            this.enableNextQuestionButton();
        }
    }

    private showNextQuestion() {
        this.isQRLBeingEvaluated = false;
        ++this.currentQuestionIndex;
        this.getQuestion(this.currentQuestionIndex);
    }

    private handleNextQuestion() {
        this.socketClientService.on(GameEvents.NextQuestion, () => {
            this.shouldEnableNextQuestionButtonAtEndOfTimer = false;
            this.playersQRLAnswers = [];
            this.isNextQuestionButtonDisable = true;
        });
    }

    private handleSubmittedAnswers() {
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
