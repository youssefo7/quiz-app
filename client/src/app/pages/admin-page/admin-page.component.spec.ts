import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPageComponent } from './admin-page.component';
import { QuizListComponent } from '@app/components/quiz-list/quiz-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AdminPageComponent, QuizListComponent],
            imports: [HttpClientTestingModule],
        });
        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
