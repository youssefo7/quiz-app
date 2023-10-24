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

    it('should grant access with right password', () => {
        const correctPassword = '1';
        service.userPassword = correctPassword;
        expect(() => service.isAccessGranted(correctPassword)).not.toThrow();
    });

    it('should deny access with wrong password', () => {
        const incorrectPassword = 'wrong password';
        service.userPassword = '2';
        expect(() => service.isAccessGranted(incorrectPassword)).toThrowError('access is not granted');
    });
});
