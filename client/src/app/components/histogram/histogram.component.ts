import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { HistogramInfo } from '@app/interfaces/histogram-info';
import { Question, Quiz } from '@app/interfaces/quiz';
import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
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
    @Input() isResultsPage: boolean;
    @Input() roomId: string;
    @Input() quiz: Quiz;
    question: Question;
    chart: Chart | null;
    goodBadChoices: boolean[];
    private histogramInfo: HistogramInfo;
    private chartDataToLoad: QuestionChartData;
    private questionsChartData: QuestionChartData[];
    private currentQuestionIndex: number;

    constructor(
        private readonly socketClientService: SocketClientService,
        private chartDataManager: ChartDataManagerService,
    ) {
        this.questionsChartData = [];
        this.goodBadChoices = [];
        this.currentQuestionIndex = 0;
        this.histogramInfo = {
            playersChoices: [],
            choicesSelectionCounts: [],
            chartBackgroundColors: [],
            chartBorderColors: [],
        };
    }

    async ngOnInit() {
        if (!this.socketClientService.socketExists()) {
            return;
        }
        if (!this.isResultsPage) {
            this.loadChart();
            this.updateSelections();
            this.reactToTransitionClockFinishedEvent();
            this.reactToSaveChartDataEvent();
        } else {
            this.questionsChartData = await this.chartDataManager.getQuestionsChartData(this.roomId);
            this.chartDataToLoad = this.chartDataManager.findChartDataToLoad(this.questionsChartData, this.currentQuestionIndex);
            this.loadChart();
        }
    }

    ngOnDestroy() {
        this.resetArrays();
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        this.questionsChartData = [];
    }

    setChartDataToLoad(loadQuestionChartData: QuestionChartData) {
        this.resetArrays();
        this.chartDataToLoad = loadQuestionChartData;
        this.currentQuestionIndex = this.chartDataToLoad.currentQuestionIndex;
        this.getQuestion(this.currentQuestionIndex);
        this.updateChartConfig();
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
                    this.histogramInfo.playersChoices.push(`Choix ${i + 1}`);
                    this.histogramInfo.choicesSelectionCounts.push(this.isResultsPage ? this.chartDataToLoad.choicesSelectionCounts[i] : 0);
                    this.histogramInfo.chartBorderColors.push('black');
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

    private reactToSaveChartDataEvent() {
        this.socketClientService.on(GameEvents.SaveChartData, () => {
            this.chartDataManager.saveChartData(
                this.histogramInfo.playersChoices,
                this.histogramInfo.choicesSelectionCounts,
                this.currentQuestionIndex,
            );
        });
    }

    private resetArrays() {
        this.histogramInfo.playersChoices = [];
        this.histogramInfo.choicesSelectionCounts = [];
        this.histogramInfo.chartBorderColors = [];
        this.histogramInfo.chartBackgroundColors = [];
        this.goodBadChoices = [];
    }

    private setBackgroundColors(choiceIndex: number) {
        const choices = this.question.choices;
        if (choices) {
            const choice = choices[choiceIndex];
            this.histogramInfo.chartBackgroundColors.push(choice.isCorrect ? 'green' : 'red');
            this.goodBadChoices.push(choice.isCorrect);
        }
    }

    private updateSelections() {
        this.socketClientService.on(GameEvents.QuestionChoiceSelect, (selectionIndex: number) => {
            if (this.chart) {
                this.histogramInfo.choicesSelectionCounts[selectionIndex]++;
                this.chart.update();
            }
        });
        this.socketClientService.on(GameEvents.QuestionChoiceUnselect, (deselectionIndex: number) => {
            if (this.chart) {
                this.histogramInfo.choicesSelectionCounts[deselectionIndex]--;
                this.chart.update();
            }
        });
    }

    private createPlayerAnswersChart() {
        this.chart = new Chart('canvas', {
            type: 'bar',
            data: {
                labels: this.histogramInfo.playersChoices,
                datasets: [
                    {
                        data: this.histogramInfo.choicesSelectionCounts,
                        borderWidth: 1,
                        backgroundColor: this.histogramInfo.chartBackgroundColors,
                        borderColor: this.histogramInfo.chartBorderColors,
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
        if (this.chart) {
            this.chart.data.labels = this.histogramInfo.playersChoices;
            this.chart.data.datasets[0].data = this.histogramInfo.choicesSelectionCounts;
            this.chart.data.datasets[0].backgroundColor = this.histogramInfo.chartBackgroundColors;
            this.chart.data.datasets[0].borderColor = this.histogramInfo.chartBorderColors;
            this.chart.update();
        }
    }
}
