import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ChartInfo } from '@app/interfaces/chart-info';
import { Question, Quiz } from '@app/interfaces/quiz';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { TimeEvents } from '@common/time.events';
import { Chart } from 'chart.js';

@Component({
    selector: 'app-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss'],
})
export class HistogramComponent implements OnInit, OnDestroy {
    @Input() quiz: Quiz;
    question: Question;
    chart: Chart;
    goodBadChoices: boolean[];
    private chartInfo: ChartInfo;
    private currentQuestionIndex: number;

    constructor(private readonly socketClientService: SocketClientService) {
        this.chartInfo.playersChoices = [];
        this.chartInfo.chartBorderColors = [];
        this.chartInfo.chartBackgroundColors = [];
        this.goodBadChoices = [];
        this.currentQuestionIndex = 0;
        this.chartInfo.choicesSelectionCounts = [];
    }

    ngOnInit() {
        if (!this.socketClientService.socketExists()) {
            return;
        }
        this.loadChart();
        this.updateSelections();
        this.reactToTransitionClockFinishedEvent();
    }

    ngOnDestroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    }

    private async loadChart() {
        this.getQuestion(this.currentQuestionIndex);
        this.createPlayerAnswersChart();
    }

    private getQuestion(index: number) {
        if (this.quiz && index < this.quiz.questions.length) {
            this.question = this.quiz.questions[index];
            for (let i = 0; i < this.question.choices.length; i++) {
                this.chartInfo.playersChoices.push(`Choix ${i + 1}`);
                this.chartInfo.choicesSelectionCounts.push(0);
                this.chartInfo.chartBorderColors.push('black');
                this.setBackgroundColors(i);
            }
        }
    }

    private reactToTransitionClockFinishedEvent() {
        this.socketClientService.on(TimeEvents.TransitionClockFinished, () => {
            this.currentQuestionIndex++;
            this.resetArrays();
            this.getQuestion(this.currentQuestionIndex);
            this.updateChartConfig();
        });
    }

    private resetArrays() {
        this.chartInfo.playersChoices = [];
        this.chartInfo.choicesSelectionCounts = [];
        this.chartInfo.chartBorderColors = [];
        this.chartInfo.chartBackgroundColors = [];
        this.goodBadChoices = [];
    }

    private setBackgroundColors(choiceIndex: number) {
        const choice = this.question.choices[choiceIndex];
        this.chartInfo.chartBackgroundColors.push(choice.isCorrect ? 'green' : 'red');
        this.goodBadChoices.push(choice.isCorrect);
    }

    private updateSelections() {
        this.socketClientService.on(GameEvents.QuestionChoiceSelect, (selectionIndex: number) => {
            this.chartInfo.choicesSelectionCounts[selectionIndex]++;
            this.chart.update();
        });
        this.socketClientService.on(GameEvents.QuestionChoiceUnselect, (deselectionIndex: number) => {
            this.chartInfo.choicesSelectionCounts[deselectionIndex]--;
            this.chart.update();
        });
    }

    private createPlayerAnswersChart() {
        this.chart = new Chart('canvas', {
            type: 'bar',
            data: {
                labels: this.chartInfo.playersChoices,
                datasets: [
                    {
                        data: this.chartInfo.choicesSelectionCounts,
                        borderWidth: 1,
                        backgroundColor: this.chartInfo.chartBackgroundColors,
                        borderColor: this.chartInfo.chartBorderColors,
                    },
                ],
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                        },
                    },
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Réponses des joueurs',
                    },
                    legend: {
                        display: false,
                    },
                },
            },
        });
    }

    private updateChartConfig() {
        this.chart.data.labels = this.chartInfo.playersChoices;
        this.chart.data.datasets[0].data = this.chartInfo.choicesSelectionCounts;
        this.chart.data.datasets[0].backgroundColor = this.chartInfo.chartBackgroundColors;
        this.chart.data.datasets[0].borderColor = this.chartInfo.chartBorderColors;
        this.chart.update();
    }
}
