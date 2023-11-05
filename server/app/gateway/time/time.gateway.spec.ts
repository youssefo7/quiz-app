import { Test, TestingModule } from '@nestjs/testing';
import { TimeGateway } from './time.gateway';

describe('TimeGateway', () => {
    let gateway: TimeGateway;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TimeGateway],
        }).compile();

        gateway = module.get<TimeGateway>(TimeGateway);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
