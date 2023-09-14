import { Component } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { BehaviorSubject } from 'rxjs';

const date = new Date();
const dateStr = date.toLocaleString('en-US', { timeZone: 'America/New_York' });

@Component({
    selector: 'app-create-quiz-form',
    templateUrl: './create-quiz-form.component.html',
    styleUrls: ['./create-quiz-form.component.scss'],
})
export class CreateQuizFormComponent {
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');
    gameList: BehaviorSubject<Quiz[]> = new BehaviorSubject<Quiz[]>([]);

    newGame: Quiz = {
        $schema: '',
        id: '',
        title: '',
        description: '',
        duration: 0,
        lastModification: dateStr,
        visibility: true,
        questions: [],
    };
}
