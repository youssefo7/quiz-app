import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { HistogramInfo } from '@app/interfaces/histogram-info';
import { Question } from '@app/interfaces/quiz';
import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { QTypes } from '@common/constants';
import { GameEvents } from '@common/game.events';
import { QuestionChartData } from '@common/question-chart-data';
import { TimeEvents } from '@common/time.events';
import { Chart } from 'chart.js';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss'],
})
export class HistogramComponent implements OnInit, OnDestroy {
    @Input() isResultsPage: boolean;
    @Input() roomId: string;
    @Input() questions: Question[];
    currentQuestion: Question;
    chart: Chart | null;
    goodBadChoices: boolean[];
    private histogramInfo: HistogramInfo;
    private chartDataToLoad: QuestionChartData;
    private questionsChartData: QuestionChartData[];
    private currentQuestionIndex: number;

    constructor(
        private readonly socketClientService: SocketClientService,
        private chartDataManager: ChartDataManagerService,
        private roomCommunicationService: RoomCommunicationService,
    ) {
        this.questionsChartData = [];
        this.goodBadChoices = [];
        this.currentQuestionIndex = 0;
        this.histogramInfo = {
            playersChoices: [],
            interactionsCount: [],
            chartBackgroundColors: [],
            chartBorderColors: [],
        };
        this.currentQuestion = {} as Question;
    }

    async ngOnInit() {
        if (!this.socketClientService.socketExists()) {
            return;
        }
        if (!this.isResultsPage) {
            await this.loadChart();
            this.updateSelections();
            this.reactToTimerEvents();
            this.reactToChartEvents();
        } else {
            this.questionsChartData = await this.chartDataManager.getQuestionsChartData(this.roomId);
            this.chartDataToLoad = this.questionsChartData[this.currentQuestionIndex];
            await this.loadChart();
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

    async setChartDataToLoad(loadQuestionChartData: QuestionChartData, currentQuestionIndex: number) {
        this.resetArrays();
        this.chartDataToLoad = loadQuestionChartData;
        this.currentQuestionIndex = currentQuestionIndex;
        await this.getQuestion(this.currentQuestionIndex);
        this.updateChartConfig();
    }

    private async loadChart() {
        await this.getQuestion(this.currentQuestionIndex);
        this.createPlayerAnswersChart();
    }

    private async getQuestion(index: number) {
        const isValidIndex = index >= 0 && index < this.questions.length;
        if (isValidIndex) {
            this.currentQuestion = this.questions[index];
            const choices = this.currentQuestion.choices;
            if (choices) {
                for (let i = 0; i < choices.length; i++) {
                    this.histogramInfo.playersChoices.push(`Choix ${i + 1}`);
                    this.histogramInfo.interactionsCount.push(this.isResultsPage ? this.chartDataToLoad.interactionsCount[i] : 0);
                    this.histogramInfo.chartBorderColors.push('black');
                    this.setBackgroundColors(i);
                }
            } else {
                const players = await firstValueFrom(this.roomCommunicationService.getRoomPlayers(this.roomId));
                this.histogramInfo.playersChoices = this.isResultsPage ? this.chartDataToLoad.playersChoices : ["N'a pas modifié", 'A modifié'];
                this.histogramInfo.interactionsCount = this.isResultsPage ? this.chartDataToLoad.interactionsCount : [players.length, 0];
                this.histogramInfo.chartBorderColors = this.isResultsPage ? ['black', 'black', 'black'] : ['black', 'black'];
                this.histogramInfo.chartBackgroundColors = this.isResultsPage ? ['red', 'yellow', 'green'] : ['red', 'green'];
            }
        }
    }

    private reactToTimerEvents() {
        this.socketClientService.on(TimeEvents.TimerFinished, async (isTransitionTimer: boolean) => {
            if (isTransitionTimer) {
                this.currentQuestionIndex++;
                this.resetArrays();
                await this.getQuestion(this.currentQuestionIndex);
                this.updateChartConfig();
            }
        });
    }

    private reactToChartEvents() {
        this.socketClientService.on(GameEvents.SaveChartData, () => {
            this.chartDataManager.saveChartData(this.histogramInfo.playersChoices, this.histogramInfo.interactionsCount);
        });

        this.socketClientService.on(GameEvents.QRLAnswerUpdate, (hasModifiedText: boolean) => {
            const hasModifiedIndex = 1;
            const hasNotModifiedIndex = 0;
            this.histogramInfo.interactionsCount[hasModifiedText ? hasModifiedIndex : hasNotModifiedIndex]++;
            this.histogramInfo.interactionsCount[hasModifiedText ? hasNotModifiedIndex : hasModifiedIndex]--;
            this.updateChartConfig();
        });
    }

    private resetArrays() {
        this.histogramInfo.playersChoices = [];
        this.histogramInfo.interactionsCount = [];
        this.histogramInfo.chartBorderColors = [];
        this.histogramInfo.chartBackgroundColors = [];
        this.goodBadChoices = [];
    }

    private setBackgroundColors(choiceIndex: number) {
        const choices = this.currentQuestion.choices;
        if (choices) {
            const choice = choices[choiceIndex];
            this.histogramInfo.chartBackgroundColors.push(choice.isCorrect ? 'green' : 'red');
            this.goodBadChoices.push(choice.isCorrect);
        }
    }

    private updateSelections() {
        this.socketClientService.on(GameEvents.QuestionChoiceSelect, (selectionIndex: number) => {
            if (this.chart) {
                this.histogramInfo.interactionsCount[selectionIndex]++;
                this.chart.update();
            }
        });
        this.socketClientService.on(GameEvents.QuestionChoiceUnselect, (deselectionIndex: number) => {
            if (this.chart) {
                this.histogramInfo.interactionsCount[deselectionIndex]--;
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
                        data: this.histogramInfo.interactionsCount,
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
                        text: this.getChartTitle(),
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
            this.chart.data.datasets[0].data = this.histogramInfo.interactionsCount;
            this.chart.data.datasets[0].backgroundColor = this.histogramInfo.chartBackgroundColors;
            this.chart.data.datasets[0].borderColor = this.histogramInfo.chartBorderColors;
            const chartPlugins = this.chart.options.plugins;
            if (chartPlugins) {
                const chartPluginsTitle = chartPlugins.title;
                if (chartPluginsTitle) {
                    chartPluginsTitle.text = this.getChartTitle();
                }
            }
            this.chart.update();
        }
    }

    private getChartTitle() {
        let chartTitle = 'Réponses des joueurs';
        if (this.currentQuestion.type === QTypes.QRL) {
            chartTitle = this.isResultsPage ? 'Notes des joueurs' : 'État de réponse des joueurs';
        }
        return chartTitle;
    }
}
