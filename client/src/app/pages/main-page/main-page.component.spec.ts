import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { CommunicationService } from '@app/services/communication.service';
import SpyObj = jasmine.SpyObj;

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let communicationServiceSpy: SpyObj<CommunicationService>;

    beforeEach(async () => {
        // communicationServiceSpy = jasmine.createSpyObj('ExampleService', ['basicGet', 'basicPost']);
        // communicationServiceSpy.basicGet.and.returnValue(of({ title: '', body: '' }));
        // communicationServiceSpy.basicPost.and.returnValue(of(new HttpResponse<string>({ status: 201, statusText: 'Created' })));

        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientModule],
            declarations: [MainPageComponent],
            providers: [{ provide: CommunicationService, useValue: communicationServiceSpy }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('The redirection page for the administer les jeux button should be /admin', () => {
        const adminButton = fixture.debugElement.nativeElement.querySelector('#admin-button');
        expect(adminButton.getAttribute('RouterLink')).toEqual('/admin');
    });

    it('The redirection page for the joindre un jeu button should be /game', () => {
        const adminButton = fixture.debugElement.nativeElement.querySelector('#join-game-button');
        expect(adminButton.getAttribute('RouterLink')).toEqual('/game');
    });

    it('The redirection page for the creer un jeu button should be /game/new', () => {
        const newGameButton = fixture.debugElement.nativeElement.querySelector('#new-game-button');
        expect(newGameButton.getAttribute('RouterLink')).toEqual('/game/new');
    });
});
