import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { AdminGuardService } from './admin-guard.service';

describe('AdminGuardService', () => {
    let service: AdminGuardService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(AdminGuardService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // using fakeAsync and tick because of timeout problems
    it('should grant access and activate /admin route only when given the right password', fakeAsync(() => {
        service.isAccessGranted('ultimate!!!password');
        let req = httpMock.expectOne(`${environment.serverUrl}/admin/login`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ password: 'ultimate!!!password' });
        req.flush(null, { status: 200, statusText: 'Ok' });
        tick();
        expect(service.canActivate()).toBeTrue();

        service.isAccessGranted('Wrong Password');
        req = httpMock.expectOne(`${environment.serverUrl}/admin/login`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ password: 'Wrong Password' });
        req.flush(null, { status: 403, statusText: 'Forbidden' });
        tick();
        expect(service.canActivate()).toBeFalse();
    }));
});
