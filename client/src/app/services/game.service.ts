import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
@Injectable({
    providedIn: 'root',
})
export class GameService {
    isNextQuestionPressed: Subject<boolean>;
    private isSubmitPressed: Subject<boolean>;
    private hasGameEnded: Subject<boolean>;

    constructor() {
        this.isSubmitPressed = new Subject<boolean>();
        this.hasGameEnded = new Subject<boolean>();
        this.isNextQuestionPressed = new Subject<boolean>();
    }

    get isButtonPressed(): Observable<boolean> {
        return this.isSubmitPressed.asObservable();
    }

    get hasGameEndedObservable(): Observable<boolean> {
        return this.hasGameEnded.asObservable();
    }

    set setButtonPressState(isPressed: boolean) {
        this.isSubmitPressed.next(isPressed);
    }

    set setGameEndState(hasEnded: boolean) {
        this.hasGameEnded.next(hasEnded);
    }
}
