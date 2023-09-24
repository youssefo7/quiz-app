import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImportPopupComponent } from './import-popup.component';

describe('ImportPopupComponent', () => {
    let component: ImportPopupComponent;
    let fixture: ComponentFixture<ImportPopupComponent>;
    let matDialogRefSpy: jasmine.SpyObj<MatDialogRef<ImportPopupComponent>>;

    beforeEach(() => {
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ImportPopupComponent],
            providers: [
                { provide: MatDialogRef, useValue: matDialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ImportPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the error messages', () => {
        component.errorMessages = ['Error', 'Error2'];
        fixture.detectChanges();
        const errorElements = fixture.debugElement.nativeElement.querySelectorAll('p');

        expect(errorElements.length).toBe(2);
        expect(errorElements[0].textContent).toBe('Error');
        expect(errorElements[1].textContent).toBe('Error2');
    });

    it('should close the modal when the cancel button is clicked', () => {
        const cancelButton = fixture.debugElement.nativeElement.querySelector('#cancelImportButton');
        cancelButton.click();
        fixture.detectChanges();

        expect(matDialogRefSpy.close).toHaveBeenCalled();
    });

    it('should split the error message by newline', () => {
        const data = { errorMessage: 'Error1\nError2\nError3' };
        component = new ImportPopupComponent(matDialogRefSpy, data);

        expect(component.errorMessages.length).toBe(3);
        expect(component.errorMessages[0]).toBe('Error1');
        expect(component.errorMessages[1]).toBe('Error2');
        expect(component.errorMessages[2]).toBe('Error3');
    });
});
