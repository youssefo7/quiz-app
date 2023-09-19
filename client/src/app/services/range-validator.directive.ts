import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appRangeValidator][ngModel]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: RangeValidatorDirective,
      multi: true
    }
  ]
})
export class RangeValidatorDirective implements Validator {
  @Input('appRangeValidator') range: { min: number, max: number };

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (isNaN(value) || value < this.range.min || value > this.range.max) {
      return { 'rangeError': true };
    }

    return null;
  }
}