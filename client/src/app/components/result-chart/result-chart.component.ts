import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { Quiz } from '@app/interfaces/quiz';
import { ChartDataManagerService } from '@app/services/chart-data-manager.service';
import { QuestionChartData } from '@common/question-chart-data';

@Component({
    selector: 'app-result-chart',
    templateUrl: './result-chart.component.html',
    styleUrls: ['./result-chart.component.scss'],
})
export class ResultChartComponent implements OnInit {
    @ViewChild(HistogramComponent, { static: false }) histogram: HistogramComponent;
    @Input() quiz: Quiz;
    @Input() roomId: string;
    chartData: QuestionChartData[];
    chartDataToLoad: QuestionChartData;
    canGoToNextQuestion: boolean;
    canGoToPreviousQuestion: boolean;
    private currentQuestionIndex: number;
    private lastQuestionIndex: number;

    constructor(private chartDataManager: ChartDataManagerService) {
        this.currentQuestionIndex = 0;
        this.chartData = [];
        this.canGoToNextQuestion = true;
        this.canGoToPreviousQuestion = false;
    }

    async ngOnInit() {
        this.chartData = await this.chartDataManager.getQuestionChartData(this.roomId);
        this.lastQuestionIndex = this.chartData.length - 1;
        // this.chartDataToLoad = this.chartDataManager.findChartDataToLoad(this.currentQuestionIndex);
    }

    viewNextQuestion() {
        if (this.isViewNextQuestionPossible()) {
            this.currentQuestionIndex++;
            this.chartDataToLoad = this.chartDataManager.findChartDataToLoad(this.chartData, this.currentQuestionIndex);
            this.updateChart();
        }
    }

    viewPreviousQuestion() {
        if (this.isViewPreviousQuestionPossible()) {
            this.currentQuestionIndex--;
            this.chartDataToLoad = this.chartDataManager.findChartDataToLoad(this.chartData, this.currentQuestionIndex);
            this.updateChart();
        }
    }

    isViewNextQuestionPossible() {
        this.canGoToNextQuestion = this.currentQuestionIndex >= 0 && this.currentQuestionIndex < this.lastQuestionIndex;
        return this.canGoToNextQuestion;
    }

    isViewPreviousQuestionPossible() {
        this.canGoToPreviousQuestion = this.currentQuestionIndex > 0 && this.currentQuestionIndex <= this.lastQuestionIndex;
        return this.canGoToPreviousQuestion;
    }

    private updateChart() {
        this.histogram.setChartDataToLoad(this.chartDataToLoad);
    }
}
