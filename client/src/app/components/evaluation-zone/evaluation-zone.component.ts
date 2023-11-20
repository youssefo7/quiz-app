import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GradeButtonState } from '@app/interfaces/qrl-grades';
import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { PlayerPoints } from '@common/player-points';
import { PlayerSubmission } from '@common/player-submission';
import { QuestionChartData } from '@common/question-chart-data';

const HALF_POINTS = 0.5;

@Component({
    selector: 'app-evaluation-zone',
    templateUrl: './evaluation-zone.component.html',
    styleUrls: ['./evaluation-zone.component.scss'],
})
export class EvaluationZoneComponent implements OnInit {
    @Input() questionPoints: number;
    @Input() questionIndex: number;
    @Input() roomId: string;
    @Output() enableNextQuestionButton: EventEmitter<null>;
    currentAnswerIndex: number;
    isEvaluationFinished: boolean;
    grade: number;
    isSubmitEvaluationDisabled: boolean;
    gradeButtonState: GradeButtonState;
    answers: PlayerSubmission[];
    private playersPoints: PlayerPoints[];

    constructor(
        private socketClientService: SocketClientService,
        private chartManagerService: ChartDataManagerService,
    ) {
        this.enableNextQuestionButton = new EventEmitter<null>();
        this.currentAnswerIndex = 0;
        this.isEvaluationFinished = false;
        this.playersPoints = [];
        this.grade = 0;
        this.isSubmitEvaluationDisabled = true;
        this.gradeButtonState = {
            isZeroGradePressed: false,
            is50GradePressed: false,
            is100GradePressed: false,
        };
        this.answers = [{ name: '', answer: '' }];
    }

    ngOnInit() {
        this.reactToAllPlayersSubmittedEvent();
    }

    setGrade(grade: number) {
        this.grade = grade;
        this.isSubmitEvaluationDisabled = false;

        switch (grade) {
            case 0:
                this.setGradeButtonState(true, false, false);
                break;
            case HALF_POINTS:
                this.setGradeButtonState(false, true, false);
                break;
            case 1:
                this.setGradeButtonState(false, false, true);
                break;
        }
    }

    givePoints() {
        this.playersPoints.push({
            name: this.answers[this.currentAnswerIndex].name,
            pointsToAdd: this.grade * this.questionPoints,
            roomId: this.roomId,
            grade: this.grade,
        });

        if (this.currentAnswerIndex === this.answers.length - 1) {
            this.playersPoints.forEach((playerPoints) => {
                this.socketClientService.send(GameEvents.AddPointsToPlayer, playerPoints);
            });
            this.savePointsStatistics();
            this.isEvaluationFinished = true;
            this.answers = [];
            this.currentAnswerIndex = 0;
            this.playersPoints = [];
            this.enableNextQuestionButton.emit();
        } else {
            this.currentAnswerIndex++;
            this.resetButtons();
        }
    }

    private reactToAllPlayersSubmittedEvent() {
        this.socketClientService.on(GameEvents.AllPlayersSubmitted, (playerQRLAnswers: PlayerSubmission[]) => {
            if (playerQRLAnswers) {
                this.resetButtons();
                this.isEvaluationFinished = false;
                this.answers = playerQRLAnswers.sort((player1, player2) => (player1.name as string).localeCompare(player2.name as string));
            }
        });
    }

    private setGradeButtonState(isZeroGradePressed: boolean, is50GradePressed: boolean, is100GradePressed: boolean) {
        this.gradeButtonState.isZeroGradePressed = isZeroGradePressed;
        this.gradeButtonState.is50GradePressed = is50GradePressed;
        this.gradeButtonState.is100GradePressed = is100GradePressed;
    }

    private savePointsStatistics() {
        const chartData: QuestionChartData = {
            playersChoices: ['0', '50', '100'],
            interactionsCount: [0, 0, 0],
            currentQuestionIndex: this.questionIndex,
        };

        this.playersPoints.forEach((playerPoints) => {
            switch (playerPoints.grade) {
                case 0:
                    chartData.interactionsCount[0]++;
                    break;
                case HALF_POINTS:
                    chartData.interactionsCount[1]++;
                    break;
                case 1:
                    chartData.interactionsCount[2]++;
                    break;
            }
        });

        this.chartManagerService.saveChartData(chartData.playersChoices, chartData.interactionsCount, chartData.currentQuestionIndex);
    }

    private resetButtons() {
        this.gradeButtonState = {
            isZeroGradePressed: false,
            is50GradePressed: false,
            is100GradePressed: false,
        };
        this.isSubmitEvaluationDisabled = true;
    }
}
