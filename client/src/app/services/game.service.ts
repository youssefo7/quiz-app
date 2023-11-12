import { Injectable } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { CommunicationService } from './communication.service';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    isNextQuestionPressed: Subject<boolean>;
    private isSubmitPressed: Subject<boolean>;
    private hasGameEnded: Subject<boolean>;

    constructor(private readonly communicationService: CommunicationService) {
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

    async getQuizById(id: string | null): Promise<Quiz | null> {
        if (id) {
            return await firstValueFrom(this.communicationService.getQuiz(id));
        }
        return null;
    }
}
