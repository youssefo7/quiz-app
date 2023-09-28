import { Directive, Input, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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

    constructor(private route: ActivatedRoute) {}

    validate(control: AbstractControl): ValidationErrors | null {
        if (!this.quizzes) {
            return null;
        }
        
        const routeParams = this.route.snapshot.paramMap;
        const quizId = String(routeParams.get('id'));
        const titleValue = control.value;
        const sameTitle = this.quizzes.find((quiz) => quiz.title.toLowerCase() === titleValue.toLowerCase());
        if(quizId === 'null') {
            if(sameTitle) {
                return { titleExists: true };
            } else {
                return null;
            }
        } else {
            const sameId = this.quizzes.find((quiz) => quiz.id === quizId);
            if(sameId !== undefined) {
                if(sameTitle !== undefined) {
                    return { titleExists: true };
                } else {
                    return null;
                }
            }
        }
        return null;
    }
}
