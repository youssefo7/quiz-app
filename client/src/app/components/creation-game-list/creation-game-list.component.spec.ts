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

    it('create button should redirect to game page', () => {
        // à compléter
    });

    it('test button should redirect to testing quiz page', () => {
        // à compléter
    });

    it('should only show visible games', () => {
        // à compléter
    });

    it('should toggle details', () => {
        // à compléter
    });

    it('should get questions', () => {
        // à compléter
    });
});
