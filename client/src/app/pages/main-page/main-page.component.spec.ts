import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { SocketClientService } from '@app/services/socket-client.service';

import SpyObj = jasmine.SpyObj;

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let matDialogServiceSpy: SpyObj<MatDialog>;
    let socketClientServiceMock: SpyObj<SocketClientService>;

    beforeEach(() => {
        matDialogServiceSpy = jasmine.createSpyObj('MatDialog', ['open']);
        socketClientServiceMock = jasmine.createSpyObj('SocketClientService', ['connect']);
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [MainPageComponent],
            providers: [
                { provide: MatDialog, useValue: matDialogServiceSpy },
                { provide: SocketClientService, useValue: socketClientServiceMock },
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
        const openAdminPopupSpy = spyOn(component, 'openAdminPopup').and.callThrough();
        adminButton.click();

        expect(openAdminPopupSpy).toHaveBeenCalled();
        expect(adminButton.innerText).toEqual('Administrer les jeux');
        expect(matDialogServiceSpy.open).toHaveBeenCalled();
    });

    it('should have a "Joindre une partie" button that opens a modal when clicked and connects client socket', () => {
        const joinGameButton: HTMLButtonElement = fixture.debugElement.nativeElement.querySelector('#join-game-button');
        const openJoinGamePopupSpy = spyOn(component, 'openJoinGamePopup').and.callThrough();
        joinGameButton.click();

        expect(openJoinGamePopupSpy).toHaveBeenCalled();
        expect(joinGameButton.innerText).toEqual('Joindre une partie');
        expect(matDialogServiceSpy.open).toHaveBeenCalled();
        expect(socketClientServiceMock.connect).toHaveBeenCalled();
    });

    it('should have a "Créer une partie" button redirecting to /game/new', () => {
        const hostGameButton = fixture.debugElement.nativeElement.querySelector('#create-game-button');
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
});
