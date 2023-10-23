// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { MatIcon } from '@angular/material/icon';
// import { ActivatedRoute } from '@angular/router';
// import { ChatComponent } from '@app/components/chat/chat.component';
// import { CountdownComponent } from '@app/components/countdown/countdown.component';
// import { ProfileComponent } from '@app/components/profile/profile.component';
// import { TopBarComponent } from '@app/components/top-bar/top-bar.component';
// import { GameService } from '@app/services/game.service';
// import { HostGamePageComponent } from './host-game-page.component';
// import SpyObj = jasmine.SpyObj;

// describe('HostGamePageComponent', () => {
//     let component: HostGamePageComponent;
//     let fixture: ComponentFixture<HostGamePageComponent>;
//     let gameServiceMock: SpyObj<GameService>;
//     let activatedRouteMock: SpyObj<ActivatedRoute>;

//     beforeEach(() => {
//         gameServiceMock = jasmine.createSpyObj<GameService>('GameService', ['getQuizById']);
//         activatedRouteMock = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', ['snapshot']);
//     });

//     beforeEach(() => {
//         TestBed.configureTestingModule({
//             declarations: [HostGamePageComponent, TopBarComponent, CountdownComponent, ProfileComponent, ChatComponent, MatIcon],
//             providers: [
//                 { provide: GameService, useValue: gameServiceMock },
//                 { provide: ActivatedRoute, useValue: activatedRouteMock },
//             ],
//         });
//         fixture = TestBed.createComponent(HostGamePageComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });
// });
