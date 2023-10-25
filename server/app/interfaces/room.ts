export interface Room {
    id: string;
    organizer: Organizer;
    players: Player[];
    isLocked: boolean;
    bannedNames: string[];
    abandonnedPlayers: string[];
    nbPlayersInit: number;
}

export interface User {
    socketId: string;
    name: string;
}

export interface Organizer extends User {}

export interface Player extends User {
    points: number;
}
