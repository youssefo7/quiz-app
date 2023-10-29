import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AdminGuardService, SessionKeys } from './admin-guard.service';

describe('AdminGuardService', () => {
    let service: AdminGuardService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],

            providers: [{ provide: Router, useValue: { navigateByUrl: jasmine.createSpy('navigateByUrl') } }],
        });
        service = TestBed.inject(AdminGuardService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

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

    it('should show admin popup if isRefreshed exists in sessionStorage', () => {
        sessionStorage.setItem(SessionKeys.IsRefreshed, 'true');
        const shouldShow = service.showAdminPopup();
        expect(shouldShow).toEqual(true);
        expect(sessionStorage.getItem(SessionKeys.ShowPasswordPopup)).toBeNull();

        sessionStorage.removeItem(SessionKeys.IsRefreshed);
        const shouldNotShow = service.showAdminPopup();
        expect(shouldNotShow).toEqual(false);
    });

    it('should initialize admin guard correctly', fakeAsync(() => {
        sessionStorage.setItem(SessionKeys.CanAccessAdmin, 'true');
        service.isAccessGranted('ultimate!!!password');
        const req = httpMock.expectOne(`${environment.serverUrl}/admin/login`);
        req.flush(null, { status: 200, statusText: 'Ok' });
        tick();
        expect(service.canActivate()).toEqual(true);
        sessionStorage.removeItem(SessionKeys.CanAccessAdmin);
        service.isAccessGranted('bad password');
        const req2 = httpMock.expectOne(`${environment.serverUrl}/admin/login`);
        req2.flush(null, { status: 403, statusText: 'Forbidden' });
        tick();
        expect(service.canActivate()).toEqual(false);
    }));

    it('should set IsRefreshed to true and accessViaPopup to false if IsRefreshed is not in sessionStorage', () => {
        service.pageRefreshState();
        expect(sessionStorage.getItem(SessionKeys.IsRefreshed)).toEqual('true');
        expect(service['accessViaPopup']).toEqual(false);
    });

    it('should not change any value if IsRefreshed is already in sessionStorage', () => {
        sessionStorage.setItem(SessionKeys.IsRefreshed, 'true');
        service.pageRefreshState();
        expect(sessionStorage.getItem(SessionKeys.IsRefreshed)).toEqual('true');
    });
});
