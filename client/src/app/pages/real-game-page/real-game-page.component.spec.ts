import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RealGamePageComponent } from './real-game-page.component';

describe('RealGamePageComponent', () => {
    let component: RealGamePageComponent;
    let fixture: ComponentFixture<RealGamePageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [RealGamePageComponent],
        });
        fixture = TestBed.createComponent(RealGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
