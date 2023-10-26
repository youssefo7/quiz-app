import { Test, TestingModule } from '@nestjs/testing';
import { WaitingGateway } from './waiting.gateway';

describe('WaitingGateway', () => {
    let gateway: WaitingGateway;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [WaitingGateway],
        }).compile();

        gateway = module.get<WaitingGateway>(WaitingGateway);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
