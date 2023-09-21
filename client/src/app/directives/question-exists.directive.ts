import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Quiz } from '@app/interfaces/quiz';

@Directive({
    selector: '[appQuestionExists]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: QuestionExistsDirective,
            multi: true,
        },
    ],
})
export class QuestionExistsDirective {
    @Input('appQuestionExists') quiz: Quiz; // Input property for the quiz containing the questions array

    validate(control: AbstractControl): ValidationErrors | null {
        if (!this.quiz || !this.quiz.questions) {
            return null; // No validation if there are no questions or quiz
        }

        const questionText = control.value;
        const isQuestionUnique = !this.quiz.questions.some((question) => question.text === questionText);

        return isQuestionUnique ? null : { titleExists: true };
    }
}
