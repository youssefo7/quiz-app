import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent in test game route', () => {
    let component: ProfileComponent;
    let fixture: ComponentFixture<ProfileComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ProfileComponent, MatIcon],
            providers: [{ provide: ActivatedRoute, useValue: { snapshot: { url: [{ path: 'test' }] } } }],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProfileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display "Testeur" when the route contains "test"', () => {
        expect(component['getProfileName']()).toEqual('Testeur');
        component.ngOnInit();
        expect(component.name).toEqual('Testeur');
    });

    it('should display points given as input', () => {
        component.points = 42;
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('span')[1].innerText).toEqual('42 points');
    });
});

describe('ProfileComponent in regular game route', () => {
    let component: ProfileComponent;
    let fixture: ComponentFixture<ProfileComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ProfileComponent, MatIcon],
            providers: [{ provide: ActivatedRoute, useValue: { snapshot: { url: [{ path: '' }] } } }],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProfileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the player name when the route doesn\'\t contain "test"', () => {
        component.playerName = 'The Goat';
        expect(component['getProfileName']()).toBeTruthy();
        component.ngOnInit();
        expect(component.name).toEqual('The Goat');
    });

    it('should display points given as input', () => {
        component.points = 42;
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('span')[1].innerText).toEqual('42 points');
    });
});

describe('ProfileComponent in host game route', () => {
    let component: ProfileComponent;
    let fixture: ComponentFixture<ProfileComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ProfileComponent, MatIcon],
            providers: [{ provide: ActivatedRoute, useValue: { snapshot: { url: [{ path: 'host' }] } } }],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProfileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display "Organisateur" when the user is the host', () => {
        component.isHost = true;
        expect(component['getProfileName']()).toEqual('Organisateur');
        component.ngOnInit();
        expect(component.name).toEqual('Organisateur');
    });

    it('should not display points if user is a host', () => {
        component.isHost = true;
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('span')[1]).toBeUndefined();
    });
});
