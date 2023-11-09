import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Quiz } from '@app/interfaces/quiz';
import { of, throwError } from 'rxjs';
import { CommunicationService } from './communication.service';
import { ImportService } from './import.service';

describe('ImportService', () => {
    let service: ImportService;
    let mockCommunicationService: jasmine.SpyObj<CommunicationService>;
    const mockQuiz = {
        id: '',
        title: '',
        duration: 0,
        lastModification: '',
        questions: [
            {
                type: '',
                text: '',
                points: 0,
                choices: [
                    {
                        text: '',
                        isCorrect: true,
                    },
                ],
            },
        ],
    } as Quiz;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('CommunicationService', ['importQuiz']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ImportService, { provide: CommunicationService, useValue: spy }],
        });
        service = TestBed.inject(ImportService);
        mockCommunicationService = TestBed.inject(CommunicationService) as jasmine.SpyObj<CommunicationService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set quizToImport to selectedFile', () => {
        const mockFile = new File(['content'], 'quiz.json', { type: 'application/json' });
        const inputEvent = {
            target: {
                files: [mockFile],
            },
        } as unknown as Event;

        service.selectQuiz(inputEvent);
        expect(service.quizToImport).toBe(mockFile);
    });

    it('should import quiz', async () => {
        const mockFileContent = JSON.stringify(mockQuiz);
        const mockFile = new File([mockFileContent], 'filename.json', { type: 'application/json' });
        service.quizToImport = mockFile;
        mockCommunicationService.importQuiz.and.returnValue(of({ ...mockQuiz, visibility: false }));
        await service.importQuiz();
        expect(mockCommunicationService.importQuiz).toHaveBeenCalledWith({ ...mockQuiz, visibility: false });
    });

    it('should catch and rethrow error from communicationService', async () => {
        const mockFileContent = JSON.stringify(mockQuiz);
        const mockFile = new File([mockFileContent], 'filename.json', { type: 'application/json' });
        service.quizToImport = mockFile;
        mockCommunicationService.importQuiz.and.returnValue(throwError(() => new Error('Titre du quiz invalide ou manquant')));

        try {
            await service.importQuiz();
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe('Titre du quiz invalide ou manquant');
            }
        }
    });

    it('should throw an error when importing non JSON file', async () => {
        const mockFile = new File(['content'], 'quiz.txt', { type: 'text/plain' });
        service.quizToImport = mockFile;
        try {
            await service.importQuiz();
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe('Seulement les fichiers JSON sont acceptés');
            }
        }
    });

    it('should throw an error file data is not an object', async () => {
        const mockFileContent = JSON.stringify('quiz1');
        const mockFile = new File([mockFileContent], 'quiz.json', { type: 'application/json' });
        service.quizToImport = mockFile;
        try {
            await service.importQuiz();
            fail('Expected an error to be thrown');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe('Il faut un objet JSON qui représente un seul quiz');
            }
        }
    });

    it('should throw an error file data is an array', async () => {
        const mockFileContent = JSON.stringify([mockQuiz, mockQuiz]);
        const mockFile = new File([mockFileContent], 'quiz.json', { type: 'application/json' });
        service.quizToImport = mockFile;
        try {
            await service.importQuiz();
            fail('Expected an error to be thrown');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe('Il faut un objet JSON qui représente un seul quiz');
            }
        }
    });

    it('should reset the input value', () => {
        const mockInput = document.createElement('input');
        mockInput.value = 'test';
        const mockEvent = { target: mockInput } as unknown as Event;

        service.resetInput(mockEvent);

        expect(mockInput.value).toBe('');
    });
});
