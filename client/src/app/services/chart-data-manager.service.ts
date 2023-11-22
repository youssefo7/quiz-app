import { Injectable } from '@angular/core';
import { QuestionChartData } from '@common/question-chart-data';
import { firstValueFrom } from 'rxjs';
import { RoomCommunicationService } from './room-communication.service';

@Injectable({
    providedIn: 'root',
})
export class ChartDataManagerService {
    private chartData: QuestionChartData[];

    constructor(private roomCommunicationService: RoomCommunicationService) {
        this.chartData = [];
    }

    async sendChartData(roomId: string): Promise<void> {
        await firstValueFrom(this.roomCommunicationService.sendQuestionsChartData(roomId, this.chartData));
    }

    async getQuestionChartData(roomId: string): Promise<QuestionChartData[]> {
        this.chartData = await firstValueFrom(this.roomCommunicationService.getQuestionChartData(roomId));
        return this.chartData;
    }

    saveChartData(playersChoices: string[], choicesSelectionCounts: number[], currentQuestionIndex: number) {
        const newChartData: QuestionChartData = {
            playersChoices,
            choicesSelectionCounts,
            currentQuestionIndex,
        };
        this.chartData.push(newChartData);
    }

    findChartDataToLoad(questionsChartData: QuestionChartData[], currentQuestionIndex: number) {
        const questionChartDataFound = questionsChartData.find(
            (questionChart) => questionChart.currentQuestionIndex === currentQuestionIndex,
        ) as QuestionChartData;
        return questionChartDataFound;
    }
}
