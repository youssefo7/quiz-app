import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuizListComponent } from './quiz-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('QuizListComponent', () => {
    let component: QuizListComponent;
    let fixture: ComponentFixture<QuizListComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuizListComponent],
            imports: [HttpClientTestingModule],
        });
        fixture = TestBed.createComponent(QuizListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
