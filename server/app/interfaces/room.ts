import { Quiz } from '@app/model/database/quiz';

export interface Room {
    id: string;
    quiz: Quiz;
    organizer: Organizer;
    players: Player[];
    isLocked: boolean;
    bannedNames: string[];
    answerTimes: AnswerTime[];
    timer: ReturnType<typeof setInterval> | null;
    results: Results[];
}

export interface User {
    socketId: string;
    name: string;
}

export interface Player extends User {
    points: number;
    bonusCount: number;
}

export interface Organizer extends User {}

export interface AnswerTime {
    userId: string;
    timeStamp: number;
}

export interface Results {
    name: string;
    points: number;
    hasAbandoned: boolean;
    bonusCount: number;
}
