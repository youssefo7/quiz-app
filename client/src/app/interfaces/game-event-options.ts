export interface GameEventOptions {
    roomId: string;
    isHost?: boolean;
    isInGame?: boolean;
    isTestGame?: boolean;
    gameAborted?: boolean;
    navigateToHome?: boolean;
    initialization?: () => void;
}
