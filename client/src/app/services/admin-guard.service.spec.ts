import { TestBed } from '@angular/core/testing';

import { AdminGuardService } from './admin-guard.service';

describe('AdminGuardService', () => {
    let service: AdminGuardService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AdminGuardService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should grant access only when given the right password', () => {
        let accessGranted = service.isAccessGranted('ultimate!!!password');
        expect(accessGranted).toEqual(true);
        accessGranted = service.isAccessGranted('wrongPassword');
        expect(accessGranted).toEqual(false);
    });

    it('should activate /admin route only when access is granted', () => {
        service.isAccessGranted('ultimate!!!password');
        expect(service.canActivate()).toEqual(true);
        service.isAccessGranted('wrongPassword');
        expect(service.canActivate()).toEqual(false);
    });
});
