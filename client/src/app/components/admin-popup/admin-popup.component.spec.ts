import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AdminGuardService } from '@app/services/admin-guard.service';
import { AdminPopupComponent } from './admin-popup.component';
import SpyObj = jasmine.SpyObj;

describe('AdminPopupComponent', () => {
    let component: AdminPopupComponent;
    let fixture: ComponentFixture<AdminPopupComponent>;
    let matDialogRefSpy: SpyObj<MatDialogRef<AdminPopupComponent>>;
    let routerSpy: SpyObj<Router>;
    let adminGuardServiceSpy: SpyObj<AdminGuardService>;

    beforeEach(() => {
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        adminGuardServiceSpy = jasmine.createSpyObj('AdminGuardService', ['isAccessGranted']);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [AdminPopupComponent],
            providers: [
                { provide: MatDialogRef, useValue: matDialogRefSpy },
                { provide: Router, useValue: routerSpy },
                { provide: AdminGuardService, useValue: adminGuardServiceSpy },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AdminPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display an error message when given password is invalid', async () => {
        adminGuardServiceSpy.isAccessGranted.and.returnValue(false);
        const submitButton = fixture.debugElement.nativeElement.querySelector('#submit');
        await submitButton.click();

        fixture.detectChanges();
        const errorMessage = fixture.debugElement.nativeElement.querySelector('.error');

        expect(errorMessage).toBeTruthy();
    });

    it('should close modal when the right password is given and redirect to /admin', async () => {
        adminGuardServiceSpy.isAccessGranted.and.returnValue(true);
        const closeAdminPopupSpy = spyOn(component, 'closeAdminPopup').and.callThrough();
        const submitButton = fixture.debugElement.nativeElement.querySelector('#submit');
        await submitButton.click();

        expect(closeAdminPopupSpy).toHaveBeenCalled();
        expect(matDialogRefSpy.close).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/admin');
    });

    it('should close the modal when the cancel button is clicked', async () => {
        const submitButton = fixture.debugElement.nativeElement.querySelector('#cancel');
        const closeAdminPopupSpy = spyOn(component, 'closeAdminPopup').and.callThrough();
        await submitButton.click();
        fixture.detectChanges();

        expect(closeAdminPopupSpy).toHaveBeenCalled();
        expect(matDialogRefSpy.close).toHaveBeenCalled();
    });

    it('should make password visible when "Afficher" checkbox is checked', async () => {
        const visibilityCheckbox = fixture.debugElement.nativeElement.querySelector('#show-hide');

        expect(component.passwordInputType).toEqual('password');

        const togglePasswordVisibilitySpy = spyOn(component, 'togglePasswordVisibility').and.callThrough();
        await visibilityCheckbox.click();
        fixture.detectChanges();

        expect(togglePasswordVisibilitySpy).toHaveBeenCalled();
        expect(component.passwordInputType).toEqual('text');
    });

    it('should make password invisible when "Afficher" checkbox is unchecked', async () => {
        const visibilityCheckbox = fixture.debugElement.nativeElement.querySelector('#show-hide');
        component.passwordInputType = 'text';

        const togglePasswordVisibilitySpy = spyOn(component, 'togglePasswordVisibility').and.callThrough();
        await visibilityCheckbox.click();
        fixture.detectChanges();

        expect(togglePasswordVisibilitySpy).toHaveBeenCalled();
        expect(component.passwordInputType).toEqual('password');
    });
});
