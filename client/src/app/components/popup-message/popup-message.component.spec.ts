import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialogRef } from '@angular/material/dialog';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { PopupMessageComponent } from './popup-message.component';

import SpyObj = jasmine.SpyObj;

describe('PopupMessageComponent', () => {
    let component: PopupMessageComponent;
    let fixture: ComponentFixture<PopupMessageComponent>;
    let matDialogRefSpy: SpyObj<MatDialogRef<PopupMessageComponent>>;

    const basicPopupConfig: PopupMessageConfig = {
        message: 'Bonjour',
        hasOkButton: true,
        hasCancelButton: true,
        okButtonText: 'OK',
        cancelButtonText: 'Annuler',
        okButtonFunction: () => {},
        cancelButtonFunction: () => {},
    };

    beforeEach(() => {
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
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
        expect(okButton.innerText).toEqual('OK');
    });

    it("should display a cancel button with appropriate text when requested in configuration's message", () => {
        const cancelButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#cancel-btn');
        expect(cancelButton).toBeTruthy();
        expect(cancelButton.innerText).toEqual('Annuler');
    });

    it("should not display an ok button when not requested in configuration's message", () => {
        component.config = { ...basicPopupConfig, hasOkButton: false };
        fixture.detectChanges();

        const okButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#ok-btn');
        expect(okButton).toBeFalsy();
    });

    it("should not display a cancel button when not requested in configuration's message", () => {
        component.config = { ...basicPopupConfig, hasCancelButton: false };
        fixture.detectChanges();

        const cancelButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#cancel-btn');
        expect(cancelButton).toBeFalsy();
    });

    it('should call given function when the ok button is clicked and close the popup', () => {
        const okFunctionSpy = spyOn<PopupMessageConfig, any>(basicPopupConfig, 'okButtonFunction'); // error when not using any...
        const okFunctionWrapperSpy = spyOn(component, 'okFunctionWrapper').and.callThrough();
        const okButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#ok-btn');
        okButton.click();

        expect(okFunctionWrapperSpy).toHaveBeenCalled();
        expect(okFunctionSpy).toHaveBeenCalled();
        expect(matDialogRefSpy.close).toHaveBeenCalled();
    });

    it('should call given function when the cancel button is clicked and close the popup', () => {
        const cancelFunctionSpy = spyOn<PopupMessageConfig, any>(basicPopupConfig, 'cancelButtonFunction'); // error when not using any...
        const cancelFunctionWrapperSpy = spyOn(component, 'cancelFunctionWrapper').and.callThrough();
        const cancelButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#cancel-btn');
        cancelButton.click();

        expect(cancelFunctionWrapperSpy).toHaveBeenCalled();
        expect(cancelFunctionSpy).toHaveBeenCalled();
        expect(matDialogRefSpy.close).toHaveBeenCalled();
    });
});
