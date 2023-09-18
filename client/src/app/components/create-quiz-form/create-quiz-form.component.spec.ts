import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { CreateQuizFormComponent } from './create-quiz-form.component';

describe('CreateQuizFormComponent', () => {
    let component: CreateQuizFormComponent;
    let fixture: ComponentFixture<CreateQuizFormComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CreateQuizFormComponent],
            imports: [HttpClientTestingModule, FormsModule],
        });
        fixture = TestBed.createComponent(CreateQuizFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
