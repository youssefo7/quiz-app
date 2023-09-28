// TODO add seperate interface for QCM and QRL

export interface Quiz {
    $schema: string;
    id: string;
    title: string;
    duration: number;
    lastModification: string;
    description: string;
    visibility?: boolean;
    questions: Question[];
}

export interface Question {
    type: string;
    text: string;
    points: number;
    choices: Choice[];
}

export interface Choice {
    text: string;
    isCorrect: boolean;
}
