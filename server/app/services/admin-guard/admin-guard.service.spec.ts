import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuardService } from './admin-guard.service';

describe('AdminGuardService', () => {
    let service: AdminGuardService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AdminGuardService],
        }).compile();

        service = module.get<AdminGuardService>(AdminGuardService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
