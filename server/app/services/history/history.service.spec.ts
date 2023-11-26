import { History, HistoryDocument } from '@app/model/database/history';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
    let service: HistoryService;
    let historyModel: Model<HistoryDocument>;

    const mockHistory: History[] = [
        {
            name: 'test',
            date: '2023-11-25 15:08:08',
            numberOfPlayers: 1,
            maxScore: 0,
        },
        {
            name: 'test2',
            date: '2023-11-25 15:08:08',
            numberOfPlayers: 1,
            maxScore: 0,
        },
    ];

    beforeEach(() => {
        historyModel = {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            deleteMany: jest.fn(),
        } as unknown as Model<HistoryDocument>;
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [HistoryService, { provide: getModelToken(History.name), useValue: historyModel }],
        }).compile();

        service = module.get<HistoryService>(HistoryService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should add game to History', async () => {
        const newHistory = { ...mockHistory[0], name: 'test3' };
        (historyModel.create as jest.Mock).mockResolvedValueOnce({
            newHistory,
            save: jest.fn().mockResolvedValueOnce(newHistory),
        });

        const addedHistory = await service.addToHistory(newHistory);
        expect(historyModel.create).toHaveBeenCalled();
        expect(addedHistory.name).toEqual('test3');
    });

    it('should get History', async () => {
        const result = mockHistory;
        jest.spyOn(historyModel, 'find').mockResolvedValue(result);
        expect(await service.getAllHistory()).toEqual(result);
    });

    it('should delete History', async () => {
        jest.spyOn(historyModel, 'deleteMany').mockResolvedValue({
            acknowledged: true,
            deletedCount: 1,
        });
        await expect(service.deleteAllHistory()).resolves.not.toThrow();
    });
});
