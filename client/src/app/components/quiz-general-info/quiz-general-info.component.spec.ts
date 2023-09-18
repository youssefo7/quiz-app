import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuizGeneralInfoComponent } from './quiz-general-info.component';

describe('QuizGeneralInfoComponent', () => {
    let component: QuizGeneralInfoComponent;
    let fixture: ComponentFixture<QuizGeneralInfoComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuizGeneralInfoComponent],
            imports: [HttpClientTestingModule],
        });
        fixture = TestBed.createComponent(QuizGeneralInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
