export interface Results {
    name: string;
    points: number;
    hasAbandoned: boolean;
    bonusCount: number;
}

export interface PlayerGameState {
    roomId: string;
    isInGame: boolean;
    points: number;
    gameAborted: boolean;
}

export interface PlayerSelection {
    roomId: string; 
    questionChoiceIndex: number
}