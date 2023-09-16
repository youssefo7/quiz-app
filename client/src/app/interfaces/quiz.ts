// TODO add seperate interface for QCM and QRL

export interface Quiz {
    $schema: string;
    id: string;
    title: string;
    description: string;
    duration: number;
    lastModification: string;
    visibility: boolean;
    questions: Question[];
}

interface Question {
    type: string;
    text: string;
    points: number;
    choices: Choice[];
}

interface Choice {
    text: string;
    isCorrect: boolean;
}
