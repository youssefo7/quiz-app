import { Component, OnInit } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
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
        let updatedQuizzes: Quiz[] = [];
        this.communicationService.deleteQuiz(quiz.id).subscribe(() => {
            updatedQuizzes = this.quizList.value.filter((q) => q !== quiz);
            this.quizList.next(updatedQuizzes);
        });
    }

    //  https://stackoverflow.com/questions/57922872/angular-save-blob-in-local-text-file
    exportQuiz(quiz: Quiz): void {
        this.communicationService.exportQuiz(quiz.id).subscribe({
            next: (response) => {
                const quizName: string = response.title;
                //  create blob file
                const blob = new Blob([JSON.stringify(response)], { type: 'application/json' });
                const blobUrl = window.URL.createObjectURL(blob);
                //  create anchor element (invisible in html)
                const anchor = document.createElement('a');
                anchor.href = blobUrl;
                anchor.download = quizName;

                anchor.click();

                window.URL.revokeObjectURL(blobUrl);
            },
            error: (error) => {
                throw new Error(`Error exporting quiz: ${error.message}`);
            },
        });
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
