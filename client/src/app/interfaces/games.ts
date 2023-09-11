export interface Game {
    name: string;
    dateCreated: string;
    visible: boolean;
    description: string;
    time: string;
    questions: QuizQuestion[];
}

export interface QuizQuestion {
    type: string;
    text: string;
    choices: QuizChoice[];
}

export interface QuizChoice {
    text: string;
    isCorrect: boolean | null;
}
