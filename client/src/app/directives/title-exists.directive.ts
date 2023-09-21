import { Directive, Input, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';
import { Quiz } from '@app/interfaces/quiz';

@Directive({
    selector: '[appTitleExists]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TitleExistsDirective),
            multi: true,
        },
    ],
})
export class TitleExistsDirective implements Validator {
    @Input('appTitleExists') quizzes: Quiz[];

    validate(control: AbstractControl): ValidationErrors | null {
        if (!this.quizzes) {
            return null; // No validation if the quizzes array is not provided
        }

        const titleValue = control.value;
        const sameTitle = this.quizzes.find((quiz) => quiz.title === titleValue);
        if (sameTitle) {
            return { titleExists: true };
        }
        return null;
    }
}
