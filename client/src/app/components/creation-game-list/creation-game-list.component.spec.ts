import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreationGameListComponent } from './creation-game-list.component';

describe('CreationGameListComponent', () => {
    let component: CreationGameListComponent;
    let fixture: ComponentFixture<CreationGameListComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CreationGameListComponent],
        });
        fixture = TestBed.createComponent(CreationGameListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
