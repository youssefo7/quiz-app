import { Quiz } from '@app/model/database/quiz';

export interface Room {
    id: string;
    quiz: Quiz;
    organizer: Organizer;
    players: Player[];
    isLocked: boolean;
    bannedNames: string[];
    answerTimes: AnswerTime[];
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
