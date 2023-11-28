import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { Quiz } from '@app/interfaces/quiz';
import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
import { QuestionChartData } from '@common/question-chart-data';

@Component({
    selector: 'app-result-chart',
    templateUrl: './result-chart.component.html',
    styleUrls: ['./result-chart.component.scss'],
})
export class ResultChartComponent implements OnInit, OnDestroy {
    @ViewChild(HistogramComponent, { static: false }) histogram: HistogramComponent;
    @Input() quiz: Quiz;
    @Input() roomId: string;
    canGoToNextQuestion: boolean;
    canGoToPreviousQuestion: boolean;
    private chartData: QuestionChartData[];
    private chartDataToLoad: QuestionChartData;
    private currentQuestionIndex: number;
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

    viewNextQuestion() {
        this.currentQuestionIndex++;
        this.updateChartToLoad();
    }

    viewPreviousQuestion() {
        this.currentQuestionIndex--;
        this.updateChartToLoad();
    }

    private isViewNextQuestionPossible() {
        const isNextQuestionPossible = this.currentQuestionIndex >= 0 && this.currentQuestionIndex < this.lastQuestionIndex;
        return isNextQuestionPossible;
    }

    private isViewPreviousQuestionPossible() {
        const isPreviousQuestionPossible = this.currentQuestionIndex > 0 && this.currentQuestionIndex <= this.lastQuestionIndex;
        return isPreviousQuestionPossible;
    }

    private updateChartToLoad() {
        this.chartDataToLoad = this.chartDataManager.findChartDataToLoad(this.chartData, this.currentQuestionIndex);
        this.updateChart();
        this.updateQuestionNavigation();
    }

    private updateQuestionNavigation() {
        this.canGoToNextQuestion = this.isViewNextQuestionPossible();
        this.canGoToPreviousQuestion = this.isViewPreviousQuestionPossible();
    }

    private updateChart() {
        this.histogram.setChartDataToLoad(this.chartDataToLoad);
    }

    private resetData() {
        this.currentQuestionIndex = 0;
        this.lastQuestionIndex = 0;
        this.chartData = [];
    }
}
