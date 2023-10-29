import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Test, TestingModule } from '@nestjs/testing';
import { JoinGateway } from './join.gateway';

describe('JoinGateway', () => {
    let gateway: JoinGateway;
    // let roomManagerServiceMock: RoomManagerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [JoinGateway, RoomManagerService],
        }).compile();

        gateway = module.get<JoinGateway>(JoinGateway);
        // roomManagerServiceMock = module.get<RoomManagerService>(RoomManagerService);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
