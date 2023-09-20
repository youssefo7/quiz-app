import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImportPopupComponent } from './import-popup.component';

describe('ImportPopupComponent', () => {
    let component: ImportPopupComponent;
    let fixture: ComponentFixture<ImportPopupComponent>;
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ImportPopupComponent],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
        });
        fixture = TestBed.createComponent(ImportPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
