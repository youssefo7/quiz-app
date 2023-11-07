import { Quiz } from './quiz';

export interface JoinRoomResponse {
    roomState: string;
    quiz: Quiz;
}
