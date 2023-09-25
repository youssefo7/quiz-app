import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    private isSubmitPressed: Subject<boolean>;

    constructor() {
        this.isSubmitPressed = new Subject<boolean>();
    }

    get isButtonPressed(): Observable<boolean> {
        return this.isSubmitPressed.asObservable();
    }

    set setButtonPressState(isPressed: boolean) {
        this.isSubmitPressed.next(isPressed);
    }
}
