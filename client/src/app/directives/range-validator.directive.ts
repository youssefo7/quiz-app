import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
    selector: '[appRangeValidator]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: RangeValidatorDirective,
            multi: true,
        },
    ],
})
export class RangeValidatorDirective implements Validator {
    @Input('appRangeValidator') range: { min: number; max: number };

    validate(control: AbstractControl): ValidationErrors | null {
        const value = control.value;

        const inRange = value < this.range.min || value > this.range.max;

        if (isNaN(value) || inRange) {
            return { rangeError: true };
        }
        return null;
    }
}
