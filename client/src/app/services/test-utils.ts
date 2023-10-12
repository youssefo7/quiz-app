import { Quiz } from '@app/interfaces/quiz';

export const MODIFIED_QUIZ: Quiz = {
    $schema: 'quiz-schema.json',
    id: '1',
    title: 'Modified Title',
    description: 'Modified Description',
    duration: 20,
    lastModification: '',
    questions: [
        {
            type: 'QCM',
            text: 'Modified Question 1',
            points: 10,
            choices: [
                { text: 'Modified Choice 1', isCorrect: true },
                { text: 'Modified Choice 2', isCorrect: false },
            ],
        },
    ],
};

export const NOT_MODIFIED_QUIZ: Quiz = {
    $schema: 'quiz-schema.json',
    id: '1',
    title: 'Title',
    description: 'Description',
    duration: 30,
    lastModification: '',
    questions: [
        {
            type: 'QCM',
            text: 'Question 1',
            points: 10,
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
            ],
        },
    ],
};

export const TDD_MODIFIED_QUIZ: Quiz = {
    $schema: 'quiz-schema.json',
    id: '1',
    title: 'Modified Title',
    description: 'Modified Description',
    duration: 40,
    lastModification: '',
    questions: [
        {
            type: 'QCM',
            text: 'Modified Question',
            points: 20,
            choices: [
                { text: 'Modified Choice 1', isCorrect: true },
                { text: 'Modified Choice 2', isCorrect: false },
            ],
        },
    ],
};

export const QUESTION_QTY_MODIFIED_QUIZ: Quiz = {
    $schema: 'quiz-schema.json',
    id: '1',
    title: 'Title',
    description: 'Description',
    duration: 30,
    lastModification: '',
    questions: [
        {
            type: 'QCM',
            text: 'Question 1',
            points: 10,
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
            ],
        },
        {
            type: 'QCM',
            text: 'Modified Question 2',
            points: 10,
            choices: [
                { text: 'Modified Choice 1', isCorrect: true },
                { text: 'Modified Choice 2', isCorrect: false },
            ],
        },
    ],
};

export const CHOICE_QTY_MODIFIED_QUIZ: Quiz = {
    $schema: 'quiz-schema.json',
    id: '1',
    title: 'Title',
    description: 'Description',
    duration: 30,
    lastModification: '',
    questions: [
        {
            type: 'QCM',
            text: 'Question 1',
            points: 10,
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
                { text: 'Choice 3', isCorrect: false },
            ],
        },
    ],
};

export const QUESTION_CHOICE_MODIFIED_QUIZ: Quiz = {
    $schema: 'quiz-schema.json',
    id: '1',
    title: 'Title',
    description: 'Description',
    duration: 30,
    lastModification: '',
    questions: [
        {
            type: 'QCM',
            text: 'Question 1',
            points: 10,
            choices: [
                { text: 'Modified Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
            ],
        },
    ],
};
