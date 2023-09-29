import { Quiz } from '@app/interfaces/quiz';

export const blankQuiz: Quiz = {
    $schema: 'quiz-schema.json',
    id: '',
    title: '',
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
};
