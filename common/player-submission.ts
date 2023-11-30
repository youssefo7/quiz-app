import { QTypes } from './constants';

export interface PlayerSubmission {
    name?: string;
    roomId?: string;
    answer?: string;
    hasSubmittedBeforeEnd?: boolean;
    questionType?: QTypes;
}
