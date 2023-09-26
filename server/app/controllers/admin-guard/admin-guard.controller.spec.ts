import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuardController } from './admin-guard.controller';

describe('AdminGuardController', () => {
  let controller: AdminGuardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminGuardController],
    }).compile();

    controller = module.get<AdminGuardController>(AdminGuardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
