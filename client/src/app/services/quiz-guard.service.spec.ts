import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminGuardService } from '@app/services/admin-guard.service';
import { QuizGuardService } from './quiz-guard.service';

describe('CreateGuardService', () => {
    let guardService: QuizGuardService;
    let adminGuardService: AdminGuardService;
    const router = {
        navigateByUrl: jasmine.createSpy('navigateByUrl'),
        getCurrentNavigation: jasmine.createSpy('getCurrentNavigation').and.returnValue(null),
        navigate: jasmine.createSpy('navigate'),
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],

            providers: [{ provide: Router, useValue: router }],
        });
        guardService = TestBed.inject(QuizGuardService);
        adminGuardService = TestBed.inject(AdminGuardService);
    });

    it('should be created', () => {
        expect(guardService).toBeTruthy();
    });

    it('should allow activation when canAccessAdmin is true and prevUrl is valid', () => {
        adminGuardService.canAccessAdmin = true;
        router.getCurrentNavigation.and.returnValue({
            trigger: 'imperative',
            previousNavigation: {
                extractedUrl: {
                    toString: () => '/admin',
                },
            },
        });

        expect(guardService.canActivate()).toBeTrue();
    });

    it('should navigate to /home when canAccessAdmin is true but prevUrl is invalid', () => {
        adminGuardService.canAccessAdmin = true;
        router.getCurrentNavigation.and.returnValue({
            trigger: 'imperative',
            previousNavigation: {
                extractedUrl: {
                    toString: () => '/invalidUrl',
                },
            },
        });

        expect(guardService.canActivate()).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should navigate to /home when canAccessAdmin is true but prevUrl is null', () => {
        adminGuardService.canAccessAdmin = true;
        router.getCurrentNavigation.and.returnValue({
            trigger: 'imperative',
            previousNavigation: {
                extractedUrl: {
                    toString: () => null,
                },
            },
        });

        expect(guardService.canActivate()).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should navigate to /home when canAccessAdmin is false', () => {
        adminGuardService.canAccessAdmin = false;
        router.getCurrentNavigation.and.returnValue({
            trigger: 'imperative',
            previousNavigation: {
                extractedUrl: {
                    toString: () => '/quiz/new',
                },
            },
        });

        expect(guardService.canActivate()).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
});
