import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';

@Directive({
    selector: '[appTitleExists]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: TitleExistsDirective,
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

        const quizId = this.route.snapshot.paramMap.get('id');
        const quizzesToParse = quizId ? this.quizzes.filter((quiz) => quiz.id !== quizId) : this.quizzes;

        const titleValue = control.value.trim();
        const isSameTitle = quizzesToParse.some((quiz) => quiz.title.toLowerCase() === titleValue.toLowerCase());

        return isSameTitle ? { titleExists: true } : null;
    }
}
