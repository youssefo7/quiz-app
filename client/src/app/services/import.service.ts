import { Injectable } from '@angular/core';
import { Quiz } from '@app/interfaces/quiz';
import { CommunicationService } from '@app/services/communication.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ImportService {
    quizToImport: File;
    constructor(private readonly communicationService: CommunicationService) {}

    selectQuiz(event: Event) {
        // Property 'files' does not exist on type 'EventTarget' so we need to cast it to HTMLInputElement
        // Example to use in html: <input type="file" (change)="onChange($event)" accept=".json" />
        // Don't use 'multiple' attribute, only one json file should be accepted
        // input type file is the only way to get the file from the user
        const input = event.target as HTMLInputElement;
        if (input && input.files && input.files.length > 0) {
            this.quizToImport = input.files[0];
        }
    }

    // TODO : add id verification in backend to avoid changing id if one already exists
    // TODO : reset input if importing again after successful previous import
    async importQuiz() {
        const fileReader = new FileReader();

        // reading file promise
        const fileContentPromise = new Promise<string>((resolve, reject) => {
            fileReader.onload = () => resolve(fileReader.result as string);
            fileReader.onerror = (error) => reject('Error reading file: ' + error);
        });

        // in case of type casting error use 'this.quizToImport as unknown as Blob'
        fileReader.readAsText(this.quizToImport, 'UTF-8');

        try {
            const fileContent = await fileContentPromise;
            const quiz: Quiz = JSON.parse(fileContent);

            quiz.visibility = false;

            if (!quiz.description) {
                quiz.description = '';
            }
            // last value from is used to get promise the observable, can't use await with observable ?
            // await this.communicationService.addQuiz(quiz); not working alone
            // https://rxjs.dev/api/index/function/lastValueFrom
            await lastValueFrom(this.communicationService.importQuiz(quiz));
        } catch (error) {
            // error when throwing non string
            // using message to avoid having "Error: message" and just receive "message"
            const message = error instanceof Error ? error.message : '' + error;
            throw new Error(message);
        }
    }

    resetInput(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input) {
            input.value = '';
        }
    }
}
