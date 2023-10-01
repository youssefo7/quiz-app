import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationPopupComponent } from './confirmation-popup.component';

describe('ConfirmationPopUpComponent', () => {
    let component: ConfirmationPopupComponent;
    let fixture: ComponentFixture<ConfirmationPopupComponent>;

    const dialogRefMock = {
        close: jasmine.createSpy('close'),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmationPopupComponent],
            imports: [MatDialogModule],
            providers: [{ provide: MatDialogRef, useValue: dialogRefMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmationPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should close with value of true on confirm()', () => {
        component.confirm();
        expect(dialogRefMock.close).toHaveBeenCalledWith(true);
    });

    it('should close with a value of false on cancel()', () => {
        component.cancel();
        expect(dialogRefMock.close).toHaveBeenCalledWith(false);
    });

    it('should set and get confirmation text', () => {
        const confirmationText = 'Are you sure?';

        component.setConfirmationText(confirmationText);
        const retrievedText = component.getConfirmationText();

        expect(retrievedText).toBe(confirmationText);
    });
});
