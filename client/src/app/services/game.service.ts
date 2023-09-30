import { Injectable } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { Observable, Subject } from 'rxjs';
import { CommunicationService } from './communication.service';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    private isSubmitPressed: Subject<boolean>;
    private hasGameEnded: Subject<boolean>;

    constructor(private readonly communicationService: CommunicationService) {
        this.isSubmitPressed = new Subject<boolean>();
        this.hasGameEnded = new Subject<boolean>();
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

    async getQuizById(id: string | null): Promise<Quiz | null> {
        if (id) {
            return new Promise<Quiz | null>((resolve) => {
                this.communicationService.getQuiz(id).subscribe((quiz) => {
                    resolve(quiz);
                });
            });
        }
        return null;
    }
}
