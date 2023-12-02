import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { Question } from '@app/interfaces/quiz';
import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
import { QuestionChartData } from '@common/question-chart-data';

@Component({
    selector: 'app-result-chart',
    templateUrl: './result-chart.component.html',
    styleUrls: ['./result-chart.component.scss'],
})
export class ResultChartComponent implements OnInit, OnDestroy {
    @ViewChild(HistogramComponent, { static: false }) histogram: HistogramComponent;
    @Input() questions: Question[];
    @Input() roomId: string;
    canGoToNextQuestion: boolean;
    canGoToPreviousQuestion: boolean;
    currentQuestionIndex: number;
    private chartData: QuestionChartData[];
    private chartDataToLoad: QuestionChartData;
    private lastQuestionIndex: number;

    constructor(private chartDataManager: ChartDataManagerService) {
        this.currentQuestionIndex = 0;
        this.lastQuestionIndex = 0;
    }

    async ngOnInit() {
        this.chartData = await this.chartDataManager.getQuestionsChartData(this.roomId);
        this.lastQuestionIndex = this.chartData.length - 1;
        this.canGoToNextQuestion = this.isViewNextQuestionPossible();
        this.canGoToPreviousQuestion = this.isViewPreviousQuestionPossible();
    }

    ngOnDestroy() {
        this.resetData();
    }

    async viewNextQuestion() {
        this.currentQuestionIndex++;
        await this.updateChartToLoad();
    }

    async viewPreviousQuestion() {
        this.currentQuestionIndex--;
        await this.updateChartToLoad();
    }

    private isViewNextQuestionPossible() {
        const isNextQuestionPossible = this.currentQuestionIndex >= 0 && this.currentQuestionIndex < this.lastQuestionIndex;
        return isNextQuestionPossible;
    }

    private isViewPreviousQuestionPossible() {
        const isPreviousQuestionPossible = this.currentQuestionIndex > 0 && this.currentQuestionIndex <= this.lastQuestionIndex;
        return isPreviousQuestionPossible;
    }

    private async updateChartToLoad() {
        this.chartDataToLoad = this.chartData[this.currentQuestionIndex];
        await this.histogram.setChartDataToLoad(this.chartDataToLoad, this.currentQuestionIndex);
        this.updateQuestionNavigation();
    }

    private updateQuestionNavigation() {
        this.canGoToNextQuestion = this.isViewNextQuestionPossible();
        this.canGoToPreviousQuestion = this.isViewPreviousQuestionPossible();
    }

    private resetData() {
        this.currentQuestionIndex = 0;
        this.lastQuestionIndex = 0;
        this.chartData = [];
    }
}
