// import { ImportService } from './../../services/import.service';
import { CommunicationService } from '@app/services/communication.service';
import { Component, OnInit } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-quiz-list',
    templateUrl: './quiz-list.component.html',
    styleUrls: ['./quiz-list.component.scss'],
})
export class QuizListComponent implements OnInit {
    quizList: BehaviorSubject<Quiz[]> = new BehaviorSubject<Quiz[]>([]);

    constructor(private communicationService: CommunicationService) {}

    ngOnInit(): void {
        this.fetchQuizzes();
    }

    fetchQuizzes(): void {
        this.communicationService.getQuizzes().subscribe((quizzes) => {
            this.quizList.next(quizzes);
        });
    }

    deleteQuiz(quiz: Quiz): void {
        this.communicationService.deleteQuiz(quiz.id).subscribe(() => {
            this.fetchQuizzes();
        });
    }

    //  https://stackoverflow.com/questions/57922872/angular-save-blob-in-local-text-file
    exportQuiz(quiz: Quiz): void {
        //  TODO: logique quiz est bon
        const exportedQuiz = { ...quiz };
        delete exportedQuiz.visibility;
        //  const exportedQuizQuestions = [ ...quiz.questions ]
        const quizName: string = quiz.title;

        //  create blob file
        const blob = new Blob([JSON.stringify(exportedQuiz)], { type: 'application/json' });
        const blobUrl = window.URL.createObjectURL(blob);
        //  create anchor element (invisible in html)
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = quizName;

        anchor.click();

        window.URL.revokeObjectURL(blobUrl);
    }

    editQuiz(quiz: Quiz): void {
        // Implement edit logic here
        quiz.title = 'editing...';
    }

    toggleVisibility(quiz: Quiz): void {
        quiz.visibility = !quiz.visibility;
        this.communicationService.updateQuiz(quiz.id, quiz).subscribe();
    }
}