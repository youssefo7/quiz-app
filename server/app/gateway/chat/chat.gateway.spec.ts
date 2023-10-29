import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    // let roomManagerServiceMock: RoomManagerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ChatGateway, RoomManagerService],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        // roomManagerServiceMock = module.get<RoomManagerService>(RoomManagerService);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
