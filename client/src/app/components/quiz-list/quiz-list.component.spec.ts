import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ImportPopupComponent } from '@app/components/import-popup/import-popup.component';
import { ImportService } from '@app/services/import.service';
import { QuizListComponent } from './quiz-list.component';
import SpyObj = jasmine.SpyObj;

describe('QuizListComponent', () => {
    let component: QuizListComponent;
    let fixture: ComponentFixture<QuizListComponent>;
    let mockImportService: SpyObj<ImportService>;
    let mockErrorDialog: SpyObj<MatDialog>;

    beforeEach(() => {
        mockImportService = jasmine.createSpyObj(['selectQuiz', 'importQuiz', 'resetInput']);
        mockErrorDialog = jasmine.createSpyObj(['open']);

        TestBed.configureTestingModule({
            declarations: [QuizListComponent],
            imports: [HttpClientTestingModule, MatDialogModule],
            providers: [
                { provide: ImportService, useValue: mockImportService },
                { provide: MatDialog, useValue: mockErrorDialog },
            ],
        });
        fixture = TestBed.createComponent(QuizListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should successfully import quiz', async () => {
        const mockEvent = new Event('change');
        await component.handleImport(mockEvent);

        expect(mockImportService.selectQuiz).toHaveBeenCalled();
        expect(mockImportService.importQuiz).toHaveBeenCalled();
        expect(mockImportService.resetInput).toHaveBeenCalled();
    });

    it('should catch error from selectQuiz', async () => {
        const error = new Error('test');
        mockImportService.selectQuiz.and.throwError(error);

        const mockEvent = new Event('change');
        await component.handleImport(mockEvent);

        expect(mockErrorDialog.open).toHaveBeenCalledWith(ImportPopupComponent, {
            data: { errorMessage: error.message },
        });
    });

    it('should catch error from importQuiz', async () => {
        const error = new Error('test');
        mockImportService.importQuiz.and.throwError(error);

        const mockEvent = new Event('change');
        await component.handleImport(mockEvent);

        expect(mockErrorDialog.open).toHaveBeenCalledWith(ImportPopupComponent, {
            data: { errorMessage: 'test' },
        });
    });
});
