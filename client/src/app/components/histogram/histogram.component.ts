import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Question, Quiz } from '@app/interfaces/quiz';
import { GameService } from '@app/services/game.service';
import { Chart } from 'chart.js';

@Component({
    selector: 'app-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss'],
})
export class HistogramComponent implements OnInit, OnDestroy {
    quiz: Quiz | null;
    chart: Chart;
    playersChoices: string[];
    playerAnswerCounts: number[];
    chartBorderColors: string[];
    chartBackgroundColors: string[];
    question: Question;
    currentQuestionIndex: number;
    goodBadChoices: boolean[];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly gameService: GameService,
    ) {
        this.playersChoices = [];
        this.playerAnswerCounts = [];
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

    async loadChart() {
        await this.getQuiz();
        this.getQuestion(this.currentQuestionIndex);
        this.getPlayersAnswers();
        this.createPlayerAnswersChart();
    }

    async getQuiz() {
        const id = this.route.snapshot.paramMap.get('id');
        this.quiz = await this.gameService.getQuizById(id);
    }

    getQuestion(index: number) {
        if (this.quiz && index < this.quiz.questions.length) {
            this.question = this.quiz.questions[index];
            for (let i = 0; i < this.question.choices.length; i++) {
                this.playersChoices.push(`Choice ${i + 1}`);
                this.playerAnswerCounts.push(0);
                this.chartBorderColors.push('black');
                this.setBackgroundColors(i);
            }
        }
    }

    setBackgroundColors(choiceIndex: number) {
        const choice = this.question.choices[choiceIndex];
        this.chartBackgroundColors.push(choice.isCorrect ? 'green' : 'red');
        this.goodBadChoices.push(choice.isCorrect);
    }

    // TODO: Get players answers dynamically from the server (use chart.update() to update the chart)
    getPlayersAnswers() {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        this.playerAnswerCounts = [3, 5, 2, 10]; // Chiffre aléatoire
    }

    createPlayerAnswersChart() {
        this.chart = new Chart('canvas', {
            type: 'bar',
            data: {
                labels: this.playersChoices,
                datasets: [
                    {
                        data: this.playerAnswerCounts,
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
