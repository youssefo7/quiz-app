import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Quiz } from '@app/interfaces/quiz';
import { NewQuizManagerService } from '@app/services/new-quiz-manager.service';

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

  @Component({
    selector: 'app-quiz-general-info',
    templateUrl: './quiz-general-info.component.html',
    styleUrls: ['./quiz-general-info.component.scss'],
  })
  export class QuizGeneralInfoComponent implements OnInit {
    myForm: FormGroup;
    newQuiz: Quiz;

    constructor(private quizController: NewQuizManagerService) {}

    ngOnInit(): void {
      this.newQuiz = this.quizController.getNewQuiz();
      this.newQuiz.duration = 60;
    }
  };
