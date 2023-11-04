import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Question, Quiz } from '@app/interfaces/quiz';
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

    constructor() {
        this.playersChoices = [];
        this.choicesSelectionCounts = [];
        this.chartBorderColors = [];
        this.chartBackgroundColors = [];
        this.goodBadChoices = [];
        this.currentQuestionIndex = 0;
    }

    ngOnInit() {
        this.loadChart();
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

    // TODO: Call this function when transitioning to the next question
    // private resetArrays() {
    //     this.playersChoices = [];
    //     this.choicesSelectionCounts = [];
    //     this.chartBorderColors = [];
    //     this.chartBackgroundColors = [];
    //     this.goodBadChoices = [];
    // }

    private setBackgroundColors(choiceIndex: number) {
        const choice = this.question.choices[choiceIndex];
        this.chartBackgroundColors.push(choice.isCorrect ? 'green' : 'red');
        this.goodBadChoices.push(choice.isCorrect);
    }

    // TODO: Get players answers dynamically from the server (use chart.update() to update the chart)
    // private getPlayersAnswers() {
    //     this.choicesSelectionCounts = [3, 5, 2, 10];
    // }

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
}
