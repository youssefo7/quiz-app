import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { QuizListComponent } from '@app/components/quiz-list/quiz-list.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { AdminGuardService } from '@app/services/admin-guard.service';
import { of } from 'rxjs';
import { AdminPageComponent } from './admin-page.component';

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    const adminGuardServiceMock = {
        pageRefreshState: jasmine.createSpy('pageRefreshState'),
        canActivate: jasmine.createSpy('canActivate'),
        canAccessAdmin: true,
    };

    const router = {
        events: of(new NavigationEnd(0, 'testURL', 'testURL_after_redirect')),
        navigateByUrl: jasmine.createSpy('navigateByUrl'),
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AdminPageComponent, QuizListComponent, TopBarComponent],
            imports: [HttpClientTestingModule, MatDialogModule],
            providers: [
                { provide: Router, useValue: router },
                { provide: AdminGuardService, useValue: adminGuardServiceMock },
            ],
        });
        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call pageRefreshState on ngOnInit', () => {
        component.ngOnInit();
        expect(adminGuardServiceMock.pageRefreshState).toHaveBeenCalled();
    });

    it('should navigate to /home if canActivate returns false', () => {
        adminGuardServiceMock.canActivate.and.returnValue(false);
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
    });

    it('should remove isRefreshed and canAccessAdmin from session storage on NavigationEnd event if URL is not /admin', () => {
        spyOn(sessionStorage, 'removeItem');
        router.events = of(new NavigationEnd(0, '/notAdmin', '/notAdmin_after_redirect'));
        component['handleAdminPageExit']();
        expect(sessionStorage.removeItem).toHaveBeenCalledWith('isRefreshed');
        expect(sessionStorage.removeItem).toHaveBeenCalledWith('canAccessAdmin');
        expect(adminGuardServiceMock.canAccessAdmin).toBeFalse();
    });

    it('should not remove isRefreshed or canAccessAdmin from session storage on NavigationEnd event if URL is /admin', () => {
        spyOn(sessionStorage, 'removeItem');
        router.events = of(new NavigationEnd(0, '/admin', '/url_after_redirect'));
        component['handleAdminPageExit']();
        expect(sessionStorage.removeItem).not.toHaveBeenCalledWith('isRefreshed');
        expect(sessionStorage.removeItem).not.toHaveBeenCalledWith('canAccessAdmin');
    });
});
