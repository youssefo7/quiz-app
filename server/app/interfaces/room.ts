export interface Room {
    id: string;
    quizId: string;
    organizer: Organizer;
    players: Player[];
    isLocked: boolean;
    bannedNames: string[];
    answerTimes: AnswerTime[];
    bonusCount: number;
}

export interface User {
    socketId: string;
    name: string;
}

export interface Player extends User {
    points: number;
    hasAbandonned: boolean;
}

export interface Organizer extends User {}

export interface AnswerTime {
    userId: string;
    timeStamp: number;
}
