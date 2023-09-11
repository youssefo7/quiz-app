import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionZoneComponent } from './question-zone.component';

describe('QuestionZoneComponent', () => {
    let component: QuestionZoneComponent;
    let fixture: ComponentFixture<QuestionZoneComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionZoneComponent],
        });
        fixture = TestBed.createComponent(QuestionZoneComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
