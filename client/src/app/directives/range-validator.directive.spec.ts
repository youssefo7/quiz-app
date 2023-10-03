import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { RangeValidatorDirective } from './range-validator.directive';

describe('RangeValidatorDirective', () => {
    let directive: RangeValidatorDirective;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [RangeValidatorDirective],
        });
    });

    beforeEach(() => {
        directive = new RangeValidatorDirective();
        directive.range = { min: 1, max: 10 };
    });

    it('should create an instance', () => {
        expect(directive).toBeTruthy();
    });

    it('should validate a value that is contained within the permitted values of the interval', () => {
        const inRangeValue = 5;
        expect(directive.validate(new FormControl(inRangeValue))).toBeNull();
    });

    it('should not validate a value above the maximum numerical range permitted', () => {
        const aboveMaximumValue = 15;
        expect(directive.validate(new FormControl(aboveMaximumValue))).toEqual({ rangeError: true });
    });

    it('should validate when the value is the same as the minimum numerical value permitted', () => {
        const minimumValue = 1;
        expect(directive.validate(new FormControl(minimumValue))).toBeNull();
    });

    it('should validate when the value is the same as the maximum numerical value permitted', () => {
        const maximumValue = 10;
        expect(directive.validate(new FormControl(maximumValue))).toBeNull();
    });

    it('should not validate a value below the minimum numerical range permitted', () => {
        const belowMinimumValue = 0;
        expect(directive.validate(new FormControl(belowMinimumValue))).toEqual({ rangeError: true });
    });

    it('should not validate a non-numerical value', () => {
        const nonNumericalValue = 'abc';
        expect(directive.validate(new FormControl(nonNumericalValue))).toEqual({ rangeError: true });
    });
});
