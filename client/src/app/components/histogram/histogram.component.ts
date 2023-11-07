import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { GameEvents } from '@app/events/game.events';
import { TimeEvents } from '@app/events/time.events';
import { Question, Quiz } from '@app/interfaces/quiz';
import { SocketClientService } from '@app/services/socket-client.service';
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
    private playersChoices: string[];
    private choicesSelectionCounts: number[];
    private chartBorderColors: string[];
    private chartBackgroundColors: string[];
    private currentQuestionIndex: number;

    constructor(private readonly socketClientService: SocketClientService) {
        this.playersChoices = [];
        this.chartBorderColors = [];
        this.chartBackgroundColors = [];
        this.goodBadChoices = [];
        this.currentQuestionIndex = 0;
        this.choicesSelectionCounts = [];
    }

    ngOnInit() {
        this.loadChart();
        this.updateSelections();
        this.reactToNextQuestionEvent();
    }

    ngOnDestroy() {
        this.chart.destroy();
    }

    private async loadChart() {
        this.getQuestion(this.currentQuestionIndex);
        this.createPlayerAnswersChart();
    }

    private getQuestion(index: number) {
        if (this.quiz && index < this.quiz.questions.length) {
            this.question = this.quiz.questions[index];
            for (let i = 0; i < this.question.choices.length; i++) {
                this.playersChoices.push(`Choix ${i + 1}`);
                this.choicesSelectionCounts.push(0);
                this.chartBorderColors.push('black');
                this.setBackgroundColors(i);
            }
        }
    }

    private reactToNextQuestionEvent() {
        this.socketClientService.on(TimeEvents.TransitionClockFinished, () => {
            this.currentQuestionIndex++;
            this.resetArrays();
            this.getQuestion(this.currentQuestionIndex);
            this.updateChartConfig();
        });
    }

    // TODO: Call this function when transitioning to the next question
    private resetArrays() {
        this.playersChoices = [];
        this.choicesSelectionCounts = [];
        this.chartBorderColors = [];
        this.chartBackgroundColors = [];
        this.goodBadChoices = [];
    }

    private setBackgroundColors(choiceIndex: number) {
        const choice = this.question.choices[choiceIndex];
        this.chartBackgroundColors.push(choice.isCorrect ? 'green' : 'red');
        this.goodBadChoices.push(choice.isCorrect);
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
