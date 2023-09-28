import { Directive, Input } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

@Directive({
    selector: '[appQuestionFormValidator]',
})
export class QuestionFormValidatorDirective {
    @Input() appQuestionFormValidator: FormGroup;

    validateForm() {
        const form = this.appQuestionFormValidator;

        if (form) {
            const questions = form.get('questions') as FormArray;
            const numQuestionsWithInput = questions.controls.filter((question) => {
                const text = question.get('text') as FormControl;
                return text.value.trim() !== '';
            }).length;

            if (numQuestionsWithInput >= 2) {
                let allQuestionsValid = true;

                questions.controls.forEach((question) => {
                    const choices = question.get('choices') as FormArray;
                    const hasCorrectChoice = choices.controls.some((choice) => choice.get('checked')?.value === true);
                    const hasIncorrectChoice = choices.controls.some((choice) => choice.get('checked')?.value === false);

                    if (!hasCorrectChoice || !hasIncorrectChoice) {
                        allQuestionsValid = false;
                    }
                });

                if (allQuestionsValid) {
                    return null;
                }
            }
        }
        return { invalidForm: true };
    }
}
