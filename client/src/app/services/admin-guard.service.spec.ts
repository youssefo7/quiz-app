import { TestBed } from '@angular/core/testing';

// import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminGuardService } from './admin-guard.service';

describe('AdminGuardService', () => {
    let service: AdminGuardService;
    let httpMock: HttpTestingController;
    let baseUrl: string;
    // let httpClient: HttpClient;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(AdminGuardService);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = service['baseUrl'];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should grant access only when given the right password', async () => {
        // spyOn(httpClient, 'post').and.returnValue(Promise.resolve());
        let accessGranted = await service.isAccessGranted('ultimate!!!password');
        expect(accessGranted).toEqual(true);
        // spyOn(httpClient, 'post').and.returnValue(throwError(() => new Error('test')));
        accessGranted = await service.isAccessGranted('wrongPassword');
        expect(accessGranted).toEqual(false);
    });

    it('should activate /admin route only when access is granted', async () => {
        const accessGrantedPromise = Promise.resolve(true);
        spyOn(service, 'isAccessGranted').and.returnValue(accessGrantedPromise);
        const req = httpMock.expectOne(`${baseUrl}/example/send`);
        expect(req.request.method).toBe('POST');
        expect(await service.canActivate()).toEqual(true);
        spyOn(service, 'isAccessGranted').and.returnValue(Promise.resolve(false));
        expect(await service.canActivate()).toEqual(false);
    });
});
