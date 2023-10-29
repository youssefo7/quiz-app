import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';

describe('GameGateway', () => {
    let gateway: GameGateway;
    // let roomManagerServiceMock: RoomManagerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GameGateway, RoomManagerService],
        }).compile();

        gateway = module.get<GameGateway>(GameGateway);
        // roomManagerServiceMock = module.get<RoomManagerService>(RoomManagerService);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
