import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveGamePageComponent } from './live-game-page.component';

describe('LiveGamePageComponent', () => {
    let component: LiveGamePageComponent;
    let fixture: ComponentFixture<LiveGamePageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [LiveGamePageComponent],
        });
        fixture = TestBed.createComponent(LiveGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('exit button should redirect to home page when clicked', () => {
        const exitButtonRoute = fixture.debugElement.nativeElement.querySelector('mat-icon').getAttribute('routerLink');
        expect(exitButtonRoute).toEqual('/home');
    });
});
