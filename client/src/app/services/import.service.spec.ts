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
        $schema: '',
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
        visibility: false,
        description: '',
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
        const mockFileContent = JSON.stringify({
            $schema: '',
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
        });

        const mockFile = new File([mockFileContent], 'filename.json', { type: 'application/json' });
        service.quizToImport = mockFile;
        mockCommunicationService.importQuiz.and.returnValue(of(mockQuiz));
        await service.importQuiz();
        expect(mockCommunicationService.importQuiz).toHaveBeenCalledWith(mockQuiz);
    });

    it('should catch and rethrow error from communicationService', async () => {
        const mockFileContent = JSON.stringify({
            $schema: '',
            id: '',
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
        });

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

    it('should reset the input value', () => {
        const mockInput = document.createElement('input');
        mockInput.value = 'test';
        const mockEvent = { target: mockInput } as unknown as Event;

        service.resetInput(mockEvent);

        expect(mockInput.value).toBe('');
    });
});
