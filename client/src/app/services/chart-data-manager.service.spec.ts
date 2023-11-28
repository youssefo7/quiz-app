import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChartDataManagerService } from './chart-data-manager.service';

describe('ChartDataManagerService', () => {
    let service: ChartDataManagerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(ChartDataManagerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
