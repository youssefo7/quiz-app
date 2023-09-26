import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { CreateQuizFormComponent } from './create-quiz-form.component';

describe('CreateQuizFormComponent', () => {
    let component: CreateQuizFormComponent;
    let fixture: ComponentFixture<CreateQuizFormComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CreateQuizFormComponent],
            imports: [HttpClientTestingModule, FormsModule, RouterTestingModule, MatDialogModule],
        });
        fixture = TestBed.createComponent(CreateQuizFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
