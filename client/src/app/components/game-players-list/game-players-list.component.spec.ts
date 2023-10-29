import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePlayersListComponent } from './game-players-list.component';

describe('GamePlayersListComponent', () => {
    let component: GamePlayersListComponent;
    let fixture: ComponentFixture<GamePlayersListComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [GamePlayersListComponent],
        });
        fixture = TestBed.createComponent(GamePlayersListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
