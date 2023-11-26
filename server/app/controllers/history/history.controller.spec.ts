import { History } from '@app/model/database/history';
import { HistoryService } from '@app/services/history/history.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { HistoryController } from './history.controller';

describe('HistoryController', () => {
    let controller: HistoryController;
    let historyService: SinonStubbedInstance<HistoryService>;

    beforeEach(async () => {
        historyService = createStubInstance(HistoryService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HistoryController],
            providers: [
                {
                    provide: HistoryService,
                    useValue: historyService,
                },
            ],
        }).compile();

        controller = module.get<HistoryController>(HistoryController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('addHistory() should add game to History', async () => {
        const newHistory = new History();
        historyService.addToHistory.resolves(newHistory);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.CREATED);
            return res;
        };
        res.json = (history) => {
            expect(history).toEqual(newHistory);
            return res;
        };

        await controller.addHistory(newHistory, res);
    });

    it('addHistory() should return INTERNAL_SERVER_ERROR when service fails to add game to History', async () => {
        historyService.addToHistory.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.send = () => res;

        await controller.addHistory(new History(), res);
    });

    it('getAllHistory() should return the History', async () => {
        const fakeHistory = [new History()];
        historyService.getAllHistory.resolves(fakeHistory);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (history) => {
            expect(history).toEqual(fakeHistory);
            return res;
        };

        await controller.getAllHistory(res);
    });

    it('getAllHistory() should return NOT_FOUND when service fails to fetch History', async () => {
        historyService.getAllHistory.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.getAllHistory(res);
    });

    it('deleteAllHistory() should delete the History', async () => {
        historyService.deleteAllHistory.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (history) => {
            expect(history).toEqual('Historique supprimé');
            return res;
        };

        await controller.deleteAllHistory(res);
    });

    it('deleteAllHistory() should return BAD_REQUEST when service fails to delete the History', async () => {
        historyService.deleteAllHistory.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.BAD_REQUEST);
            return res;
        };
        res.send = () => res;

        await controller.deleteAllHistory(res);
    });
});
