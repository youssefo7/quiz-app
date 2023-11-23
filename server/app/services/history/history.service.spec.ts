import { History, HistoryDocument } from '@app/model/database/history';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
    let service: HistoryService;
    let historyModel: Model<HistoryDocument>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [HistoryService, { provide: getModelToken(History.name), useValue: historyModel }],
        }).compile();

        service = module.get<HistoryService>(HistoryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
