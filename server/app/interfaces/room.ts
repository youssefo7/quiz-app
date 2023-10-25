export interface Room {
    id: string;
    quizId: string;
    organizer: User;
    players: User[];
    isLocked: boolean;
    bannedNames: string[];
    abandonnedPlayers: string[];
    answerTimes: AnswerTime[];
}

export interface User {
    socketId: string;
    name: string;
}

export interface AnswerTime {
    userId: string;
    timeStamp: number;
}
