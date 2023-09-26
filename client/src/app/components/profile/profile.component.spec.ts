import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent in test game route', () => {
    let component: ProfileComponent;
    let fixture: ComponentFixture<ProfileComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ProfileComponent],
            imports: [MatIconModule],
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
        expect(component.name).toEqual('Testeur');
    });

    it('should display points given as input', () => {
        component.points = 42;
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('span')[1].innerText).toEqual('[ 42 points ]');
    });
});

describe('ProfileComponent in regular game route', () => {
    let component: ProfileComponent;
    let fixture: ComponentFixture<ProfileComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ProfileComponent],
            imports: [MatIconModule],
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

    it('should display nothing when the route doesn\'\t contain "test"', () => {
        expect(component.name).toEqual('');
    });

    it('should display points given as input', () => {
        component.points = 42;
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('span')[1].innerText).toEqual('[ 42 points ]');
    });
});
