import { FormControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { TitleExistsDirective } from './title-exists.directive';

describe('TitleExistsDirective', () => {
    let directive: TitleExistsDirective;
    let control: FormControl;
    let mockActivatedRoute: ActivatedRoute;

    const testQuizzes: Quiz[] = [
        {
            $schema: 'quiz-schema.json',
            id: '1',
            title: 'Quiz 1',
            description: '',
            duration: 0,
            lastModification: '',
            visibility: false,
            questions: [
                {
                    type: '',
                    text: '',
                    points: 0,
                    choices: [
                        {
                            text: '',
                            isCorrect: false,
                        },
                    ],
                },
            ],
        },
    ];

    beforeEach(() => {
        mockActivatedRoute = {
            snapshot: {
                paramMap: {
                    get: (param: string) => {
                        if (param === 'id') {
                            return '1';
                        }
                        return null;
                    },
                },
            },
        } as ActivatedRoute;

        directive = new TitleExistsDirective(mockActivatedRoute);
        control = new FormControl();
        directive.quizzes = testQuizzes;
    });

    it('Should create an instance', () => {
        expect(directive).toBeTruthy();
    });

    it('Should return null if quizzes are not provided', () => {
        directive.quizzes = null as unknown as Quiz[];
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('Should return null if the title does not match any existing quiz', () => {
        control.setValue('New Quiz Title');
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('Should return { titleExists: true } if the title matches an existing quiz', () => {
        mockActivatedRoute.snapshot.paramMap.get = () => null;
        control.setValue('Quiz 1');
        const validatorResult = directive.validate(control) as ValidationErrors;
        expect(validatorResult).toEqual({ titleExists: true });
    });

    it('Should exclude the current quiz when comparing titles', () => {
        control.setValue('Quiz 1');
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('Should not return null if the URL does not have an ID but the title exists', () => {
        mockActivatedRoute.snapshot.paramMap.get = () => null;
        control.setValue('Quiz 1');
        const validatorResult = directive.validate(control) as ValidationErrors;
        expect(validatorResult).toEqual({ titleExists: true });
    });

    it('Should work when there are no quizzes in the database and the route snapshot does not have a quiz ID', () => {
        directive.quizzes = null as unknown as Quiz[];
        mockActivatedRoute.snapshot.paramMap.get = () => null;
        control.setValue('Quiz 1');
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('Should filter the quizzes from the database based on the route snapshot', () => {
        control.setValue('Quiz 1');
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('Should return { titleExists: true } for quizzes with the same title but different character casing', () => {
        mockActivatedRoute.snapshot.paramMap.get = () => null;
        control.setValue('quiz 1');
        const validatorResult = directive.validate(control) as ValidationErrors;
        expect(validatorResult).toEqual({ titleExists: true });
    });
});
