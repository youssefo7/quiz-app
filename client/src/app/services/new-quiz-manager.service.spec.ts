import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { NewQuizManagerService } from './new-quiz-manager.service';

describe('NewQuizManagerService', () => {
    let service: NewQuizManagerService;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
        service = TestBed.inject(NewQuizManagerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
