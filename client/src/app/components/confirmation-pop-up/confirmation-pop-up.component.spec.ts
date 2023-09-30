import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationPopUpComponent } from './confirmation-pop-up.component';

describe('ConfirmationPopUpComponent', () => {
    let component: ConfirmationPopUpComponent;
    let fixture: ComponentFixture<ConfirmationPopUpComponent>;

    const dialogRefMock = {
        close: jasmine.createSpy('close'),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmationPopUpComponent],
            imports: [MatDialogModule],
            providers: [{ provide: MatDialogRef, useValue: dialogRefMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmationPopUpComponent);
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
