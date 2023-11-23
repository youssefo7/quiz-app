import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluationZoneComponent } from './evaluation-zone.component';

describe('EvaluationZoneComponent', () => {
    let component: EvaluationZoneComponent;
    let fixture: ComponentFixture<EvaluationZoneComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [EvaluationZoneComponent],
        });
        fixture = TestBed.createComponent(EvaluationZoneComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
