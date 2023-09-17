import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Quiz } from '@app/interfaces/quiz';
import { of } from 'rxjs';
import { CommunicationService } from './communication.service';
import { ImportService } from './import.service';

describe('ImportService', () => {
    let service: ImportService;
    // jasmine instead of jest to avoid package.json changes
    let mockCommunicationService: jasmine.SpyObj<CommunicationService>;
    beforeEach(() => {
        const spy = jasmine.createSpyObj('CommunicationService', ['addQuiz']);
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
        // mock has no visibility and no description
        const mockFileContent = JSON.stringify({
            $schema: '',
            id: '',
            title: '',
            duration: 0,
            lastModification: '',
            questions: [],
        });
        // expect visibility to be false and description to be empty
        const mockQuiz = {
            $schema: '',
            id: '',
            title: '',
            duration: 0,
            lastModification: '',
            questions: [],
            visibility: false,
            description: '',
        } as Quiz;

        const mockFile = new File([mockFileContent], 'filename.json', { type: 'application/json' });
        service.quizToImport = mockFile;
        // mocking addQuiz to return observable
        mockCommunicationService.addQuiz.and.returnValue(of(mockQuiz));
        await service.importQuiz();
        expect(mockCommunicationService.addQuiz).toHaveBeenCalledWith(mockQuiz);
    });
});
