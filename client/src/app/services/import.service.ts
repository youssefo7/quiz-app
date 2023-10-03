import { Injectable } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ImportService {
    quizToImport: File;
    constructor(private communicationService: CommunicationService) {}

    selectQuiz(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input && input.files && input.files.length > 0) {
            this.quizToImport = input.files[0];
        }
    }

    async importQuiz() {
        const fileReader = new FileReader();

        if (!this.quizToImport.name.toLowerCase().endsWith('.json')) {
            throw new Error('Seulement les fichiers JSON sont acceptés');
        }

        const fileContentPromise = new Promise<string>((resolve, reject) => {
            fileReader.onload = () => resolve(fileReader.result as string);
            fileReader.onerror = (error) => reject('Error reading file: ' + error);
        });

        fileReader.readAsText(this.quizToImport, 'UTF-8');

        try {
            const fileContent = await fileContentPromise;
            const quiz: Quiz = JSON.parse(fileContent);

            if (Array.isArray(quiz) || typeof quiz !== 'object') {
                throw new Error('Il faut un objet JSON qui représente un seul quiz');
            }
            quiz.visibility = false;

            await lastValueFrom(this.communicationService.importQuiz(quiz));
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
        }
    }

    resetInput(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input) {
            input.value = '';
        }
    }
}
