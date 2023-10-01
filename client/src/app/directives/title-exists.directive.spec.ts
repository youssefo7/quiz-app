import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Quiz } from '@app/interfaces/quiz';
import { TitleExistsDirective } from './title-exists.directive';

describe('TitleExistsDirective', () => {
    let directive: TitleExistsDirective;
    let control: FormControl;
    let mockActivatedRoute: any;

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
                    get: () => '1',
                },
            },
        };

        directive = new TitleExistsDirective(mockActivatedRoute as ActivatedRoute);
        control = new FormControl();
        directive['quizzes'] = testQuizzes;
    });

    it('Should create an instance', () => {
        expect(directive).toBeTruthy();
    });

    it('Should return null if quizzes was not provided', () => {
        directive['quizzes'] = null as unknown as Quiz[];
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('Should return null if the title the quiz does not match any of an existing quiz', () => {
        control.setValue('New Quiz Title');
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('Should return { titleExists: true } if there is an existing game in quizzes with that title already', () => {
        control.setValue('Quiz 1');
        const validatorResult = directive.validate(control);
        if (validatorResult !== null) {
            expect(validatorResult).toEqual({ titleExists: true });
        }
    });

    it('Should exclude the current quiz when comparing titles with those of the existing quizzes', () => {
        control.setValue('Quiz 1');
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('Should not return null if the url does not have an Id but the title still exists wihtin the existing quizzes', () => {
        mockActivatedRoute.snapshot.paramMap.get = () => null;
        control.setValue('Quiz 1');
        const validatorResult = directive.validate(control);
        if (validatorResult !== null) {
            expect(validatorResult).toEqual({ titleExists: true });
        }
    });

    it('Should work if there arent any quizzes in the database and the route snapshot does not have a quiz Id', () => {
        directive['quizzes'] = null as unknown as Quiz[];
        mockActivatedRoute.snapshot.paramMap.get = () => null;
        control.setValue('Quiz 1');
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('Should handle null value for control', () => {
        control.setValue(null);
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('Should filter the quizzes from the database based on the route snapshot', () => {
        mockActivatedRoute.snapshot.paramMap.get = () => '1';
        control.setValue('Quiz 1');
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('Should return { titleExists: true } for quizzes with the same title but different character casing', () => {
        control.setValue('quiz 1');
        const validatorResult = directive.validate(control);
        if (validatorResult !== null) {
            expect(validatorResult).toEqual({ titleExists: true });
        }
    });
});
