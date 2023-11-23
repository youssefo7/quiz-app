import { HistoryService } from '@app/services/history/history.service';
import { Test, TestingModule } from '@nestjs/testing';
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
});
