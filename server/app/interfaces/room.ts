import { Quiz } from '@app/model/database/quiz';
import { ChatMessage } from '@common/chat-message';
import { Results } from '@common/player-info';
import { PlayerSubmission } from '@common/player-submission';
import { QuestionChartData } from '@common/question-chart-data';

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
    chatMessage: ChatMessage[];
    questionsChartData: QuestionChartData[];
    submissionCount: number;
    qrlAnswers: PlayerSubmission[];
}

export interface User {
    socketId: string;
    name: string;
}

export interface Player extends User {
    points: number;
    bonusCount: number;
    canChat: boolean;
    hasSubmitted: boolean;
}

export interface Organizer extends User {}

export interface AnswerTime {
    userId: string;
    timeStamp: number | null;
}
