import { QTypes } from './constants';

export interface PlayerSubmission {
    name?: string;
    roomId?: string;
    answer?: string;
    hasSubmitted: boolean;
    questionType?: QTypes;
}
