import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AdminGuardService, SessionKeys } from './admin-guard.service';

describe('AdminGuardService', () => {
    let service: AdminGuardService;
    let httpMock: HttpTestingController;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],

            providers: [{ provide: Router, useValue: { navigateByUrl: jasmine.createSpy('navigateByUrl') } }],
        });
        service = TestBed.inject(AdminGuardService);
        httpMock = TestBed.inject(HttpTestingController);
        router = TestBed.inject(Router);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should grant access and activate /admin route only when given the right password', fakeAsync(() => {
        service.isAccessGranted('1');
        let req = httpMock.expectOne(`${environment.serverUrl}/admin/login`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ password: '1' });
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

    it('should set ShowPasswordPopup in sessionStorage and navigate to /home if page was refreshed', () => {
        sessionStorage.removeItem(SessionKeys.IsRefreshed);
        service.pageRefreshState();
        expect(sessionStorage.getItem(SessionKeys.IsRefreshed)).toEqual('true');

        sessionStorage.setItem(SessionKeys.IsRefreshed, 'true');
        service.pageRefreshState();
        expect(sessionStorage.getItem(SessionKeys.ShowPasswordPopup)).toEqual('true');
        expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
    });

    it('should show admin popup if ShowPasswordPopup is set in sessionStorage', () => {
        sessionStorage.setItem(SessionKeys.ShowPasswordPopup, 'true');
        const shouldShow = service.showAdminPopup();
        expect(shouldShow).toEqual(true);
        expect(sessionStorage.getItem(SessionKeys.ShowPasswordPopup)).toBeNull();

        const shouldNotShow = service.showAdminPopup();
        expect(shouldNotShow).toEqual(false);
    });

    it('should initialize admin guard correctly', () => {
        sessionStorage.setItem(SessionKeys.CanAccessAdmin, 'true');
        service.initializeAdminGuard();
        expect(service.canActivate()).toEqual(true);

        sessionStorage.removeItem(SessionKeys.CanAccessAdmin);
        service.initializeAdminGuard();
        expect(service.canActivate()).toEqual(false);
    });
});
