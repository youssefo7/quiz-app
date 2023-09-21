import { Directive } from '@angular/core';
import { AbstractControl, FormArray, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
    selector: '[appChoiceValidation]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: ChoiceValidationDirective,
            multi: true,
        },
    ],
})
export class ChoiceValidationDirective implements Validator {
    validate(control: AbstractControl): ValidationErrors | null {
        const choices = control as FormArray;

        // Check if at least the first 2 choices are not empty
        const firstTwoCompleted = choices.controls.slice(0, 2).every((choice) => {
            return choice.get('text')?.value.trim() !== '';
        });

        if (!firstTwoCompleted) {
            return { firstTwoChoicesIncomplete: true };
        }

        // Check if at least 1 choice is marked as correct
        const atLeastOneCorrect = choices.controls.some((choice) => {
            return choice.get('checked')?.value === true;
        });

        if (!atLeastOneCorrect) {
            return { noCorrectChoice: true };
        }

        return null; // Validation passed
    }
}
