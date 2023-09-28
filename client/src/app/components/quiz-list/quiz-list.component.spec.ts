import { CommunicationService } from '@app/services/communication.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ImportPopupComponent } from '@app/components/import-popup/import-popup.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { ImportService } from '@app/services/import.service';
import { QuizListComponent } from './quiz-list.component';
import SpyObj = jasmine.SpyObj;
import { BehaviorSubject, of } from 'rxjs';
import { Quiz } from '@app/interfaces/quiz';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';

describe('QuizListComponent', () => {
    let component: QuizListComponent;
    let fixture: ComponentFixture<QuizListComponent>;
    let communicationService: CommunicationService;
    let mockImportService: SpyObj<ImportService>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;

    const mockQuizList: Quiz[] = [
        {
            $schema: 'quiz-schema.json',
            id: '546',
            title: 'Connaissez-vous bien le JavaScript ?',
            duration: 10,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: false,
            description: 'Le quiz parfait pour les débutants en Javascript',
            questions: [],
        },
        {
            $schema: 'quiz-schema.json',
            id: '986',
            title: 'Histoire et culture generale',
            duration: 15,
            lastModification: '2018-11-13T20:20:39+00:00',
            visibility: false,
            description: "Montrez que vous êtes incollable sur l'histoire et la culture générale",
            questions: [],
        },
    ];

    const propQuiz: Quiz = {
        $schema: 'quiz-schema.json',
        id: '986',
        title: 'Histoire et culture generale',
        duration: 15,
        lastModification: '2018-11-13T20:20:39+00:00',
        visibility: false,
        description: "Montrez que vous êtes incollable sur l'histoire et la culture générale",
        questions: [],
    };

    beforeEach(() => {
        mockImportService = jasmine.createSpyObj('mockImportService', ['selectQuiz', 'importQuiz', 'resetInput']);
        mockDialog = jasmine.createSpyObj('mockDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj('mockDialogRef', ['componentInstance']);

        TestBed.configureTestingModule({
            declarations: [QuizListComponent],
            imports: [HttpClientTestingModule, MatDialogModule],
            providers: [
                { provide: ImportService, useValue: mockImportService },
                { provide: MatDialog, useValue: mockDialog },
            ],
        });
    });

    beforeEach(() => {
        communicationService = TestBed.inject(CommunicationService);
        mockDialog.open.and.returnValue(mockDialogRef);
        fixture = TestBed.createComponent(QuizListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should successfully import quiz', async () => {
        const mockEvent = new Event('change');
        spyOn(component, 'importSuccessPopup').and.callThrough();

        await component.handleImport(mockEvent);

        expect(mockImportService.selectQuiz).toHaveBeenCalled();
        expect(mockImportService.importQuiz).toHaveBeenCalled();
        expect(component.importSuccessPopup).toHaveBeenCalled();
        expect(mockImportService.resetInput).toHaveBeenCalled();
    });

    it('should open import success popup', () => {
        const expectedConfig = {
            message: 'Importation réussie',
            hasCancelButton: false,
        };
        component.importSuccessPopup();

        expect(mockDialog.open).toHaveBeenCalledWith(PopupMessageComponent);
        expect(mockDialogRef.componentInstance.config).toEqual(expectedConfig);
    });

    it('should catch error from selectQuiz', async () => {
        const error = new Error('test');
        mockImportService.selectQuiz.and.throwError(error);

        const mockEvent = new Event('change');
        await component.handleImport(mockEvent);

        expect(mockDialog.open).toHaveBeenCalledWith(ImportPopupComponent, {
            data: { errorMessage: error.message },
        });
    });

    it('should catch error from importQuiz', async () => {
        const error = new Error('test');
        mockImportService.importQuiz.and.throwError(error);

        const mockEvent = new Event('change');
        await component.handleImport(mockEvent);

        expect(mockDialog.open).toHaveBeenCalledWith(ImportPopupComponent, {
            data: { errorMessage: 'test' },
        });
    });

    it('should fetch quiz list on window load', () => {
        const quizListSubject = new BehaviorSubject<Quiz[]>([]);
        spyOn(communicationService, 'getQuizzes').and.returnValue(of(mockQuizList));

        component.quizList = quizListSubject;

        component.ngOnInit();

        expect(quizListSubject.value).toEqual(mockQuizList);
        expect(communicationService.getQuizzes).toHaveBeenCalled();
    });

    it('should call delete quiz service with the correct quiz', () => {
        spyOn(communicationService, 'deleteQuiz').and.returnValue(of(propQuiz.id));

        component.deleteQuiz(propQuiz);

        expect(communicationService.deleteQuiz).toHaveBeenCalledWith(propQuiz.id);
    });

    it('should call update quiz service with the correct quiz', () => {
        spyOn(communicationService, 'updateQuiz').and.returnValue(of(propQuiz));

        component.toggleVisibility(propQuiz);

        expect(communicationService.updateQuiz).toHaveBeenCalledWith(propQuiz.id, propQuiz);
    });

    it('should export the quiz', () => {
        const blob = new Blob([JSON.stringify(propQuiz)], { type: 'application/json' });
        const anchorElement = document.createElement('a');

        spyOn(document, 'createElement').and.returnValue(anchorElement);
        spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');

        component.exportQuiz(propQuiz);

        expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
        expect(anchorElement.download).toBe(propQuiz.title);
    });

    it('should popup a message when the user tries to delete a quiz with the correct configuration', () => {
        const mockConfig: PopupMessageConfig = {
            message: "Ëtes-vous sûr de vouloir supprimer ce quiz? Cette action n'est pas reversible.",
            hasCancelButton: true,
            okButtonText: 'Supprimer',
            cancelButtonText: 'Annuler',
        };

        component.openPopupDelete(propQuiz);
        const config = mockDialogRef.componentInstance.config;

        expect(mockDialog.open).toHaveBeenCalled();
        expect(config.message).toEqual(mockConfig.message);
        expect(config.hasCancelButton).toEqual(mockConfig.hasCancelButton);
        expect(config.okButtonText).toEqual(mockConfig.okButtonText);
        expect(config.cancelButtonText).toEqual(mockConfig.cancelButtonText);
        expect(config.okButtonFunction).toBeDefined();
    });
});
