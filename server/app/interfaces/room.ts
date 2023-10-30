export interface Room {
    id: string;
    quizId: string;
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

// TODO : voir s'il y a un risque d'envoyer des événements à un joueur qui a abandonné
export interface Player extends User {
    points: number;
    bonusCount: number;
}

export interface Organizer extends User {}

export interface AnswerTime {
    userId: string;
    timeStamp: number;
}
