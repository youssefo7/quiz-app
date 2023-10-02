import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RangeValidatorDirective } from './range-validator.directive';

@Component({
    template: '<input type="number" [ngModel]="value" [appRangeValidator]="range" />',
})
class TestComponent {
    value: number;
    range = { min: 1, max: 10 };
}

describe('RangeValidatorDirective', () => {
    let fixture: ComponentFixture<TestComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [TestComponent, RangeValidatorDirective],
            imports: [FormsModule],
        });
        fixture = TestBed.createComponent(TestComponent);
    });

    it('Should create an instance', () => {
        const directive = new RangeValidatorDirective();
        expect(directive).toBeTruthy();
    });

    it('Should validate a value that is contained within the permitted values of the interval', () => {
        fixture.componentInstance.value = 5;
        fixture.detectChanges();
        const inputElement = fixture.debugElement.nativeElement.querySelector('input');
        expect(inputElement.validity).toBeTruthy();
    });

    it('Should not validate a value above the maximum numerical range permitted', () => {
        fixture.componentInstance.value = 15;
        fixture.detectChanges();
        const inputElement = fixture.debugElement.nativeElement.querySelector('input');
        expect(inputElement.value.validity).toBeFalsy();
    });

    it('Should not validate a value below the minimum numerical range permitted', () => {
        fixture.componentInstance.value = 0;
        fixture.detectChanges();
        const inputElement = fixture.debugElement.nativeElement.querySelector('input');
        expect(inputElement.value.validity).toBeFalsy();
    });

    it('Should not validate a non-numeric value', () => {
        fixture.componentInstance.value = 'abc' as unknown as number;
        fixture.detectChanges();
        const inputElement = fixture.debugElement.nativeElement.querySelector('input');
        expect(inputElement.value.validity).toBeFalsy();
    });
});
