import { TestBed } from '@angular/core/testing';

import { RoomCommunicationService } from './room-communication.service';

describe('RoomCommunicationService', () => {
  let service: RoomCommunicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoomCommunicationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
