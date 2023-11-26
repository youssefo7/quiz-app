import { History, HistoryDocument } from '@app/model/database/history';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class HistoryService {
    constructor(@InjectModel(History.name) public historyModel: Model<HistoryDocument>) {}

    async addToHistory(history: History): Promise<History> {
        const newHistory = await this.historyModel.create(history);
        return await newHistory.save();
    }

    async getAllHistory(): Promise<History[]> {
        return await this.historyModel.find({});
    }

    async deleteAllHistory() {
        await this.historyModel.deleteMany({});
    }
}
