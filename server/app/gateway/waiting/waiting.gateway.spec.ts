import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Test, TestingModule } from '@nestjs/testing';
import { WaitingGateway } from './waiting.gateway';

describe('WaitingGateway', () => {
    let gateway: WaitingGateway;
    // let roomManagerServiceMock: RoomManagerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [WaitingGateway, RoomManagerService],
        }).compile();

        gateway = module.get<WaitingGateway>(WaitingGateway);
        // roomManagerServiceMock = module.get<RoomManagerService>(RoomManagerService);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
