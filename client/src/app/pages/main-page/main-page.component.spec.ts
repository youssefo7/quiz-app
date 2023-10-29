import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { AdminGuardService } from '@app/services/admin-guard.service';
import { of } from 'rxjs';

import SpyObj = jasmine.SpyObj;

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let matDialogServiceSpy: SpyObj<MatDialog>;
    let adminGuardServiceMock: SpyObj<AdminGuardService>;

    const routerMock = {
        events: of(new NavigationEnd(0, 'testURL', 'testURL_after_redirect')),
    };

    beforeEach(() => {
        matDialogServiceSpy = jasmine.createSpyObj('MatDialog', ['open']);
        adminGuardServiceMock = jasmine.createSpyObj('AdminGuardService', ['showAdminPopup']);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [MainPageComponent],
            providers: [
                { provide: MatDialog, useValue: matDialogServiceSpy },
                { provide: AdminGuardService, useValue: adminGuardServiceMock },
                { provide: Router, useValue: routerMock },
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have a "Administrer les jeux" button that opens a modal when clicked', () => {
        const adminButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#admin-button');
        adminButton.click();

        expect(adminButton.innerText).toEqual('Administrer les jeux');
        expect(matDialogServiceSpy.open).toHaveBeenCalled();
    });

    // it('should have a "Joindre une partie" button redirecting to /game', () => {
    //     const joinGameButton = fixture.debugElement.nativeElement.querySelector('#join-game-button');
    //     expect(joinGameButton.innerText).toEqual('Joindre une partie');
    //     expect(joinGameButton.getAttribute('RouterLink')).toEqual('/game');
    // });

    it('should have a "Créer une partie" button redirecting to /game/new', () => {
        const hostGameButton = fixture.debugElement.nativeElement.querySelector('#host-game-button');
        expect(hostGameButton.innerText).toEqual('Créer une partie');
        expect(hostGameButton.getAttribute('RouterLink')).toEqual('/game/new');
    });

    it('should have a section heading containing the team number', () => {
        const teamName = fixture.debugElement.nativeElement.querySelector('h4');
        expect(teamName.innerHTML).toBe('Équipe Poly 207');
    });

    it('should have teammate names in the page', () => {
        const teammates = fixture.debugElement.nativeElement.querySelector('#name-list');
        const nNames = 6;
        expect(teammates.childElementCount).toBe(nNames);
        expect(teammates.children[0].innerHTML).toBe('Ali Abbas');
        expect(teammates.children[1].innerHTML).toBe('Bryan Tadié');
        expect(teammates.children[2].innerHTML).toBe('Gabrielle Côté');
        expect(teammates.children[3].innerHTML).toBe('Massimo Donato');
        expect(teammates.children[4].innerHTML).toBe('Rima Al-Zawahra');
        expect(teammates.children[5].innerHTML).toBe('Youssef Ouarad');
    });

    it('should open the admin popup if admin page is refreshed', () => {
        adminGuardServiceMock.showAdminPopup.and.returnValue(true);
        spyOn(component, 'openAdminPopup');
        component.initializeComponent();
        expect(component.openAdminPopup).toHaveBeenCalled();
    });

    it('should not open the admin popup if admin page was not refreshed', () => {
        adminGuardServiceMock.showAdminPopup.and.returnValue(false);
        spyOn(component, 'openAdminPopup');
        component.initializeComponent();
        expect(component.openAdminPopup).not.toHaveBeenCalled();
    });

    it('should remove adminAccessViaPopup from session storage on NavigationEnd event if URL is not /admin', () => {
        spyOn(sessionStorage, 'removeItem');
        routerMock.events = of(new NavigationEnd(0, '/notAdmin', '/notAdmin_after_redirect'));
        component.initializeComponent();
        expect(sessionStorage.removeItem).toHaveBeenCalledWith('adminAccessViaPopup');
    });

    it('should not remove adminAccessViaPopup from session storage on NavigationEnd event if URL is /admin', () => {
        spyOn(sessionStorage, 'removeItem');
        routerMock.events = of(new NavigationEnd(0, '/admin', '/admin_after_redirect'));
        component.initializeComponent();
        expect(sessionStorage.removeItem).not.toHaveBeenCalledWith('adminAccessViaPopup');
    });

    it('should call openAdminPopup if adminGuardService.showAdminPopup is true', () => {
        adminGuardServiceMock.showAdminPopup.and.returnValue(true);
        spyOn(component, 'openAdminPopup');
        component.initializeComponent();
        expect(component.openAdminPopup).toHaveBeenCalled();
    });

    it('should not call openAdminPopup if adminGuardService.showAdminPopup is false', () => {
        adminGuardServiceMock.showAdminPopup.and.returnValue(false);
        spyOn(component, 'openAdminPopup');
        component.initializeComponent();
        expect(component.openAdminPopup).not.toHaveBeenCalled();
    });
});
