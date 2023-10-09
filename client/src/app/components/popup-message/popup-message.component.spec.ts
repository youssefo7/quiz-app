import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { PopupMessageComponent } from './popup-message.component';

import SpyObj = jasmine.SpyObj;

describe('PopupMessageComponent', () => {
    let component: PopupMessageComponent;
    let fixture: ComponentFixture<PopupMessageComponent>;
    let matDialogRefSpy: SpyObj<MatDialogRef<PopupMessageComponent>>;

    const basicPopupConfig: PopupMessageConfig = {
        message: 'Bonjour',
        hasCancelButton: true,
        okButtonText: 'OK fourni',
        cancelButtonText: 'Annuler fourni',
        okButtonFunction: () => {
            // empty
        },
        cancelButtonFunction: () => {
            // empty
        },
    };

    beforeEach(() => {
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MatDialogModule],
            declarations: [PopupMessageComponent],
            providers: [{ provide: MatDialogRef, useValue: matDialogRefSpy }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PopupMessageComponent);
        component = fixture.componentInstance;
        component.config = basicPopupConfig;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it("should display given configuration's message", () => {
        const popupMessage: HTMLParagraphElement = fixture.debugElement.nativeElement.querySelector('p');
        expect(popupMessage.innerText).toEqual('Bonjour');
    });

    it("should display an ok button with appropriate text when requested in configuration's message", () => {
        const okButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#ok-btn');
        expect(okButton).toBeTruthy();
        expect(okButton.innerText).toEqual('OK fourni');
    });

    it("should display a cancel button with appropriate text when requested in configuration's message", () => {
        const cancelButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#cancel-btn');
        expect(cancelButton).toBeTruthy();
        expect(cancelButton.innerText).toEqual('Annuler fourni');
    });

    it('should display default OK button text when none is given', () => {
        const newConfig: PopupMessageConfig = { ...basicPopupConfig };
        delete newConfig.okButtonText;
        delete newConfig.okButtonFunction;
        component.config = newConfig;
        fixture.detectChanges();

        const okButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#ok-btn');
        expect(okButton.innerText).toEqual('OK');
    });

    it('should display default cancel button text when none is given', () => {
        const newConfig: PopupMessageConfig = { ...basicPopupConfig };
        delete newConfig.cancelButtonText;
        delete newConfig.cancelButtonFunction;
        component.config = newConfig;
        fixture.detectChanges();

        const cancelButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#cancel-btn');
        expect(cancelButton.innerText).toEqual('Annuler');
    });

    it("should not display a cancel button when not requested in configuration's message", () => {
        component.config = { ...basicPopupConfig, hasCancelButton: false };
        fixture.detectChanges();

        const cancelButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#cancel-btn');
        expect(cancelButton).toBeFalsy();
    });

    it('should call given function when the ok button is clicked and close the popup', () => {
        // Only way since we could't make a spy for this function without an error
        let okFunctionCalled = false;
        const newConfig = {
            ...basicPopupConfig,
            okButtonFunction: () => {
                okFunctionCalled = true;
            },
        };
        component.config = newConfig;
        fixture.detectChanges();

        const okFunctionWrapperSpy = spyOn(component, 'okFunctionWrapper').and.callThrough();
        const okButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#ok-btn');
        okButton.click();

        expect(okFunctionWrapperSpy).toHaveBeenCalled();
        expect(okFunctionCalled).toBeTrue();
        expect(matDialogRefSpy.close).toHaveBeenCalled();
    });

    it('should call given function when the cancel button is clicked and close the popup', () => {
        // Only way since we could't make a spy for this function without an error
        let cancelFunctionCalled = false;
        const newConfig = {
            ...basicPopupConfig,
            cancelButtonFunction: () => {
                cancelFunctionCalled = true;
            },
        };
        component.config = newConfig;
        fixture.detectChanges();

        const cancelFunctionWrapperSpy = spyOn(component, 'cancelFunctionWrapper').and.callThrough();
        const cancelButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#cancel-btn');
        cancelButton.click();

        expect(cancelFunctionWrapperSpy).toHaveBeenCalled();
        expect(cancelFunctionCalled).toBeTrue();
        expect(matDialogRefSpy.close).toHaveBeenCalled();
    });
});
