import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('Should have an administer game button redirecting to /admin', () => {
        const adminButton = fixture.debugElement.nativeElement.querySelector('#admin-button');
        expect(adminButton.getAttribute('RouterLink')).toEqual('/admin');
    });

    it('Should have a join game button redirecting to /game', () => {
        const adminButton = fixture.debugElement.nativeElement.querySelector('#join-game-button');
        expect(adminButton.getAttribute('RouterLink')).toEqual('/game');
    });

    it('Should have a host game button redirecting to /game/new', () => {
        const hostGameButton = fixture.debugElement.nativeElement.querySelector('#host-game-button');
        expect(hostGameButton.getAttribute('RouterLink')).toEqual('/game/host');
    });

    it('Should have a section heading containing the team number', () => {
        const teamName = fixture.debugElement.nativeElement.querySelector('h4');
        expect(teamName.classList).toContain('team-name');
    });

    it('Should have teammate names in the footer of the page', () => {
        const teammates = fixture.debugElement.nativeElement.querySelector('p');
        const firstChild = teammates.firstChild;
        const lastChild = teammates.lastChild;
        const nNames = 6;
        expect(teammates.childElementCount).toBe(nNames);
        expect(firstChild.classList).toContain('teammate-name');
        expect(lastChild.classList).toContain('teammate-name');
    });
});
