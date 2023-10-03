import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
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
        TestBed.configureTestingModule({
            declarations: [TitleExistsDirective],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
            ],
        });
    });

    beforeEach(() => {
        mockActivatedRoute = {
            snapshot: {
                paramMap: {
                    get: () => '1',
                },
            },
        } as unknown as ActivatedRoute;

        directive = new TitleExistsDirective(mockActivatedRoute);
        control = new FormControl();
        directive.quizzes = testQuizzes;
    });

    it('should create an instance', () => {
        expect(directive).toBeTruthy();
    });

    it('should return null if quizzes are not provided', () => {
        directive.quizzes = null;
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('should return null if the title does not match any existing quiz', () => {
        control.setValue('New Quiz Title');
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('should return { titleExists: true } if the title matches an existing quiz', () => {
        mockActivatedRoute.snapshot.paramMap.get = () => null;
        control.setValue('Quiz 1');
        const validatorResult = directive.validate(control);
        expect(validatorResult).toEqual({ titleExists: true });
    });

    it('should exclude the current quiz when comparing titles', () => {
        control.setValue('Quiz 1');
        const validatorResult = directive.validate(control);
        expect(validatorResult).toBeNull();
    });

    it('should return { titleExists: true } for quizzes with the same title but different character casing', () => {
        mockActivatedRoute.snapshot.paramMap.get = () => null;
        control.setValue('quiz 1');
        const validatorResult = directive.validate(control);
        expect(validatorResult).toEqual({ titleExists: true });
    });
});
