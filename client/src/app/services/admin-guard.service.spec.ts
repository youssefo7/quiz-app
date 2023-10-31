import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AdminGuardService, SessionKeys } from './admin-guard.service';

describe('AdminGuardService', () => {
    let service: AdminGuardService;
    let httpMock: HttpTestingController;
    const router = {
        navigateByUrl: jasmine.createSpy('navigateByUrl'),
        getCurrentNavigation: jasmine.createSpy('getCurrentNavigation'),
        navigate: jasmine.createSpy('navigate'),
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],

            providers: [{ provide: Router, useValue: router }],
        });
        service = TestBed.inject(AdminGuardService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    beforeEach(() => {
        sessionStorage.clear();
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize admin guard to true when sessionStorage has canAccessAdmin set to true', fakeAsync(() => {
        sessionStorage.setItem(SessionKeys.CanAccessAdmin, 'true');
        service['canAccessAdmin'] = sessionStorage.getItem(SessionKeys.CanAccessAdmin) === 'true';
        expect(service.canAccessAdmin).toBeTrue();
    }));

    it('should initialize admin guard to false when sessionStorage has canAccessAdmin set to false', fakeAsync(() => {
        sessionStorage.setItem(SessionKeys.CanAccessAdmin, 'false');
        service['canAccessAdmin'] = sessionStorage.getItem(SessionKeys.CanAccessAdmin) === 'true';
        expect(service.canAccessAdmin).toBeFalse();
    }));

    it('should grant access and activate /admin route only when given the right password', fakeAsync(() => {
        service.isAccessGranted('ultimate!!!password');
        let req = httpMock.expectOne(`${environment.serverUrl}/admin/login`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ password: 'ultimate!!!password' });
        req.flush(null, { status: 200, statusText: 'Ok' });
        tick();
        expect(service.canAccessAdmin).toBeTrue();

        service.isAccessGranted('Wrong Password');
        req = httpMock.expectOne(`${environment.serverUrl}/admin/login`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ password: 'Wrong Password' });
        req.flush(null, { status: 403, statusText: 'Forbidden' });
        tick();
        expect(service.canAccessAdmin).toBeFalse();
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

    it('should allow activation when canAccessAdmin is true and prevUrl is valid', () => {
        service.canAccessAdmin = true;
        router.getCurrentNavigation.and.returnValue({
            trigger: 'imperative',
            previousNavigation: {
                extractedUrl: {
                    toString: () => '/quiz/new',
                },
            },
        });

        expect(service.canActivate()).toBeTrue();
    });

    it('should navigate to /home when canAccessAdmin is true but prevUrl is invalid', () => {
        service.canAccessAdmin = true;
        router.getCurrentNavigation.and.returnValue({
            trigger: 'imperative',
            previousNavigation: {
                extractedUrl: {
                    toString: () => '/invalidUrl',
                },
            },
        });

        expect(service.canActivate()).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should navigate to /home when canAccessAdmin is false', () => {
        service.canAccessAdmin = false;
        router.getCurrentNavigation.and.returnValue({
            trigger: 'imperative',
            previousNavigation: {
                extractedUrl: {
                    toString: () => '/quiz/new',
                },
            },
        });

        expect(service.canActivate()).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
});
