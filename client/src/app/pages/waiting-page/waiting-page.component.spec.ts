import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
import { WaitingPageComponent } from './waiting-page.component';

@Component({
    selector: 'app-player-list',
})
class PlayerListComponent {}

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [WaitingPageComponent, TopBarComponent, PlayerListComponent],
        }).compileComponents();
        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
