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

    async getQuestionsChartData(roomId: string): Promise<QuestionChartData[]> {
        this.chartData = await firstValueFrom(this.roomCommunicationService.getQuestionsChartData(roomId));
        return this.chartData;
    }

    saveChartData(playersChoices: string[], interactionsCount: number[]) {
        const newChartData: QuestionChartData = {
            playersChoices,
            interactionsCount,
        };
        this.chartData.push(newChartData);
    }

    findChartDataToLoad(questionsChartData: QuestionChartData[], currentQuestionIndex: number): QuestionChartData {
        const questionChartDataFound = questionsChartData[currentQuestionIndex];
        return questionChartDataFound;
    }

    resetChartData() {
        this.chartData = [];
    }
}
