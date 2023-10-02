// // import { FormControl } from '@angular/forms';
// // import { ActivatedRoute } from '@angular/router';
// // import { Quiz } from '@app/interfaces/quiz';
// // import { TitleExistsDirective } from './title-exists.directive';

// // describe('TitleExistsDirective', () => {
// //     let directive: TitleExistsDirective;
// //     let control: FormControl;
// //     let mockActivatedRoute: any;

// //     const testQuizzes: Quiz[] = [
// //         {
// //             $schema: 'quiz-schema.json',
// //             id: '1',
// //             title: 'Quiz 1',
// //             description: '',
// //             duration: 0,
// //             lastModification: '',
// //             visibility: false,
// //             questions: [
// //                 {
// //                     type: '',
// //                     text: '',
// //                     points: 0,
// //                     choices: [
// //                         {
// //                             text: '',
// //                             isCorrect: false,
// //                         },
// //                     ],
// //                 },
// //             ],
// //         },
// //     ];

// //     beforeEach(() => {
// //         mockActivatedRoute = {
// //             snapshot: {
// //                 paramMap: {
// //                     get: () => '1',
// //                 },
// //             },
// //         };

// //         directive = new TitleExistsDirective(mockActivatedRoute as ActivatedRoute);
// //         control = new FormControl();
// //         directive['quizzes'] = testQuizzes;
// //     });
// import { TestBed } from '@angular/core';
// import { FormControl } from '@angular/forms';
// import { ActivatedRoute } from '@angular/router';
// import { Quiz } from '@app/interfaces/quiz';
// import { of } from 'rxjs';
// import { TitleExistsDirective } from './title-exists.directive';

// class MockActivatedRoute implements ActivatedRoute {
//     readonly snapshot = {
//         paramMap: new Map<string, string>([['id', '1']]),
//     } as any;

//     paramMap = of(this.snapshot.paramMap);
// }

// describe('TitleExistsDirective', () => {
//     let directive: TitleExistsDirective;
//     let control: FormControl;

//     const testQuizzes: Quiz[] = [
//         // Your test data here
//     ];

//     beforeEach(() => {
//         TestBed.configureTestingModule({
//             providers: [
//                 TitleExistsDirective,
//                 { provide: ActivatedRoute, useClass: MockActivatedRoute },
//             ],
//         });

//         directive = TestBed.inject(TitleExistsDirective);
//         control = new FormControl();
//         directive['quizzes'] = testQuizzes;
//     });

//     it('Should create an instance', () => {
//         expect(directive).toBeTruthy();
//     });

//     it('Should return null if quizzes was not provided', () => {
//         directive['quizzes'] = null as unknown as Quiz[];
//         const validatorResult = directive.validate(control);
//         expect(validatorResult).toBeNull();
//     });

//     it('Should return null if the title the quiz does not match any of an existing quiz', () => {
//         control.setValue('New Quiz Title');
//         const validatorResult = directive.validate(control);
//         expect(validatorResult).toBeNull();
//     });

//     it('Should return { titleExists: true } if there is an existing game in quizzes with that title already', () => {
//         // mockActivatedRoute.snapshot.paramMap.get = () => null;
//         control.setValue('Quiz 1');
//         const validatorResult = directive.validate(control);
//         expect(validatorResult).toEqual({ titleExists: true });
//     });

//     it('Should exclude the current quiz when comparing titles with those of the existing quizzes', () => {
//         control.setValue('Quiz 1');
//         const validatorResult = directive.validate(control);
//         expect(validatorResult).toBeNull();
//     });

//     it('Should not return null if the url does not have an Id but the title still exists wihtin the existing quizzes', () => {
//         // mockActivatedRoute.snapshot.paramMap.get = () => null;
//         control.setValue('Quiz 1');
//         const validatorResult = directive.validate(control);
//         expect(validatorResult).toEqual({ titleExists: true });
//     });

//     it('Should work if there arent any quizzes in the database and the route snapshot does not have a quiz Id', () => {
//         directive['quizzes'] = null as unknown as Quiz[];
//         // mockActivatedRoute.snapshot.paramMap.get = () => null;
//         control.setValue('Quiz 1');
//         const validatorResult = directive.validate(control);
//         expect(validatorResult).toBeNull();
//     });

//     it('Should filter the quizzes from the database based on the route snapshot', () => {
//         control.setValue('Quiz 1');
//         const validatorResult = directive.validate(control);
//         expect(validatorResult).toBeNull();
//     });

//     it('Should return { titleExists: true } for quizzes with the same title but different character casing', () => {
//         // mockActivatedRoute.snapshot.paramMap.get = () => null;
//         control.setValue('quiz 1');
//         const validatorResult = directive.validate(control);
//         expect(validatorResult).toEqual({ titleExists: true });
//     });
// });

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
        // Add more test quizzes as needed
    ];

    beforeEach(() => {
        // Create a mock ActivatedRoute
        mockActivatedRoute = {
            snapshot: {
                paramMap: {
                    get: (param: string) => {
                        if (param === 'id') {
                            return '1'; // Replace with the appropriate value
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
