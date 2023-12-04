import { Quiz } from './quiz';

export interface JoinRoomResponse {
    roomState: string;
    quiz: Quiz;
}

export interface NewRoomResponse {
    roomId: string;
}
