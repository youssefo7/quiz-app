import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { RoomCommunicationService } from './room-communication.service';

describe('RoomCommunicationService', () => {
    let service: RoomCommunicationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(RoomCommunicationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
