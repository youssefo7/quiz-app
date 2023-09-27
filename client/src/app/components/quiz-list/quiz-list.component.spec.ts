import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ImportPopupComponent } from '@app/components/import-popup/import-popup.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { ImportService } from '@app/services/import.service';
import { QuizListComponent } from './quiz-list.component';
import SpyObj = jasmine.SpyObj;

describe('QuizListComponent', () => {
    let component: QuizListComponent;
    let fixture: ComponentFixture<QuizListComponent>;
    let mockImportService: SpyObj<ImportService>;
    let mockDialog: SpyObj<MatDialog>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;

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
});
