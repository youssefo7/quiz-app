import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance } from 'sinon';
import { RoomController } from './room.controller';

describe('RoomController', () => {
    let controller: RoomController;
    let roomManagerService: SinonStubbedInstance<RoomManagerService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RoomController],
            providers: [
                {
                    provide: RoomManagerService,
                    useValue: roomManagerService,
                },
            ],
        }).compile();

        controller = module.get<RoomController>(RoomController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
