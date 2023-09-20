import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportPopupComponent } from './import-popup.component';

describe('ImportPopupComponent', () => {
    let component: ImportPopupComponent;
    let fixture: ComponentFixture<ImportPopupComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ImportPopupComponent],
        });
        fixture = TestBed.createComponent(ImportPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
