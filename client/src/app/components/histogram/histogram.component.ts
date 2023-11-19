import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Question, Quiz } from '@app/interfaces/quiz';
import { SocketClientService } from '@app/services/socket-client.service';
import { GameEvents } from '@common/game.events';
import { QuestionChartData } from '@common/question-chart-data';
import { TimeEvents } from '@common/time.events';
import { Chart } from 'chart.js';

@Component({
    selector: 'app-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss'],
})
export class HistogramComponent implements OnInit, OnDestroy {
    @Input() roomId: string;
    @Input() quiz: Quiz;
    question: Question;
    chart: Chart;
    goodBadChoices: boolean[];
    private questionChartData: QuestionChartData[];
    private playersChoices: string[];
    private choicesSelectionCounts: number[];
    private chartBorderColors: string[];
    private chartBackgroundColors: string[];
    private currentQuestionIndex: number;

    constructor(private readonly socketClientService: SocketClientService) {
        this.questionChartData = [];
        this.playersChoices = [];
        this.chartBorderColors = [];
        this.chartBackgroundColors = [];
        this.goodBadChoices = [];
        this.currentQuestionIndex = 0;
        this.choicesSelectionCounts = [];
    }

    ngOnInit() {
        if (!this.socketClientService.socketExists()) {
            return;
        }
        this.loadChart();
        this.updateSelections();
        this.reactToTransitionClockFinishedEvent();
        this.reactToTimerFinishedEvent();
    }

    ngOnDestroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    }

    getQuestionChartData(): QuestionChartData[] {
        return this.questionChartData;
    }

    private saveChartData() {
        const newChartData: QuestionChartData = {
            playersChoices: this.playersChoices,
            choicesSelectionCounts: this.choicesSelectionCounts,
            chartBorderColors: this.chartBorderColors,
            chartBackgroundColors: this.chartBackgroundColors,
            currentQuestionIndex: this.currentQuestionIndex,
        };
        this.questionChartData.push(newChartData);
    }

    private async loadChart() {
        this.getQuestion(this.currentQuestionIndex);
        this.createPlayerAnswersChart();
    }

    private getQuestion(index: number) {
        const isValidIndex = this.quiz && index < this.quiz.questions.length;
        if (isValidIndex) {
            this.question = this.quiz.questions[index];
            const choices = this.question.choices;
            if (choices) {
                for (let i = 0; i < choices.length; i++) {
                    this.playersChoices.push(`Choix ${i + 1}`);
                    this.choicesSelectionCounts.push(0);
                    this.chartBorderColors.push('black');
                    this.setBackgroundColors(i);
                }
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

    private reactToTimerFinishedEvent() {
        this.socketClientService.on(GameEvents.SaveChartData, () => {
            this.saveChartData();
        });
    }

    private resetArrays() {
        this.playersChoices = [];
        this.choicesSelectionCounts = [];
        this.chartBorderColors = [];
        this.chartBackgroundColors = [];
        this.goodBadChoices = [];
    }

    private setBackgroundColors(choiceIndex: number) {
        const choices = this.question.choices;
        if (choices) {
            const choice = choices[choiceIndex];
            this.chartBackgroundColors.push(choice.isCorrect ? 'green' : 'red');
            this.goodBadChoices.push(choice.isCorrect);
        }
    }

    private updateSelections() {
        this.socketClientService.on(GameEvents.QuestionChoiceSelect, (selectionIndex: number) => {
            this.choicesSelectionCounts[selectionIndex]++;
            this.chart.update();
        });
        this.socketClientService.on(GameEvents.QuestionChoiceUnselect, (deselectionIndex: number) => {
            this.choicesSelectionCounts[deselectionIndex]--;
            this.chart.update();
        });
    }

    private createPlayerAnswersChart() {
        this.chart = new Chart('canvas', {
            type: 'bar',
            data: {
                labels: this.playersChoices,
                datasets: [
                    {
                        data: this.choicesSelectionCounts,
                        borderWidth: 1,
                        backgroundColor: this.chartBackgroundColors,
                        borderColor: this.chartBorderColors,
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
        this.chart.data.labels = this.playersChoices;
        this.chart.data.datasets[0].data = this.choicesSelectionCounts;
        this.chart.data.datasets[0].backgroundColor = this.chartBackgroundColors;
        this.chart.data.datasets[0].borderColor = this.chartBorderColors;
        this.chart.update();
    }
}
