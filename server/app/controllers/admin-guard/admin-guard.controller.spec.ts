import { AdminGuardService } from '@app/services/admin-guard/admin-guard.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { AdminGuardController } from './admin-guard.controller';

describe('AdminGuardController', () => {
    let controller: AdminGuardController;
    let adminGuardService: SinonStubbedInstance<AdminGuardService>;

    beforeEach(async () => {
        adminGuardService = createStubInstance(AdminGuardService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminGuardController],
            providers: [
                {
                    provide: AdminGuardService,
                    useValue: adminGuardService,
                },
            ],
        }).compile();

        controller = module.get<AdminGuardController>(AdminGuardController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('isAccessAdmin() should return OK when access is granted', async () => {
        adminGuardService.isAccessGranted.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (response) => {
            expect(response.message).toEqual('access is granted');
            return res;
        };

        await controller.isAccessAdmin({ password: 'test' }, res);
    });

    it('isAccessAdmin() should return FORBIDDEN when access is not granted', async () => {
        adminGuardService.isAccessGranted.throws(new Error('access is not granted'));

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.FORBIDDEN);
            return res;
        };
        res.json = (response) => {
            expect(response.message).toEqual('access is not granted');
            return res;
        };

        await controller.isAccessAdmin({ password: 'test' }, res);
    });
});
