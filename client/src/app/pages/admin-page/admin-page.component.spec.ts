import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { QuizListComponent } from '@app/components/quiz-list/quiz-list.component';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { AdminPageComponent } from './admin-page.component';

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AdminPageComponent, QuizListComponent, TopBarComponent],
            imports: [HttpClientTestingModule, MatDialogModule],
        });
        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
