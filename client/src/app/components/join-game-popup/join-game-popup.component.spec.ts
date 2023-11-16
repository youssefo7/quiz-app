import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { Quiz } from '@app/interfaces/quiz';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { JoinEvents } from '@common/join.events';
import { of } from 'rxjs';
import { JoinGamePopupComponent } from './join-game-popup.component';
import SpyObj = jasmine.SpyObj;

describe('JoinGamePopupComponent', () => {
    let component: JoinGamePopupComponent;
    let routerSpy: SpyObj<Router>;
    let fixture: ComponentFixture<JoinGamePopupComponent>;
    let mockDialogRef: SpyObj<MatDialogRef<PopupMessageComponent>>;
    let mockSocketClientService: SpyObj<SocketClientService>;
    let mockRoomCommunicationService: SpyObj<RoomCommunicationService>;

    const roomIdMock = '1234';
    const mockSocket = { id: 'socketId' };

    const mockJoinRoomResponse = {
        roomState: '',
        quiz: {} as Quiz,
    };

    const mockJoinRoomResponseOK = {
        roomState: 'OK',
        quiz: { id: 'mockId' } as Quiz,
    };

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockRoomCommunicationService = jasmine.createSpyObj('RoomCommunicationService', ['joinRoom', 'processUsername']);
        mockSocketClientService = jasmine.createSpyObj('SocketClientService', ['connect', 'socketExists', 'send']);
        Object.defineProperty(mockSocketClientService, 'socket', { get: () => mockSocket });
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [JoinGamePopupComponent, MatIcon, MatDialogContent, MatDialogActions],
            imports: [FormsModule],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: SocketClientService, useValue: mockSocketClientService },
                { provide: RoomCommunicationService, useValue: mockRoomCommunicationService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JoinGamePopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should handle enter press when code is not valid', async () => {
        const checkCodeSpy = spyOn(component, 'checkCode');
        component.isCodeValidated = false;
        const event = new KeyboardEvent('keyup', {
            key: 'Enter',
        });
        fixture.debugElement.triggerEventHandler('keyup', event);

        await fixture.whenStable();
        expect(checkCodeSpy).toHaveBeenCalled();
    });

    it('should handle enter press when code is valid', async () => {
        const verifyAndAccessSpy = spyOn(component, 'verifyAndAccess');
        component.isCodeValidated = true;
        component.showUsernameField = true;
        const event = new KeyboardEvent('keyup', {
            key: 'Enter',
        });
        fixture.debugElement.triggerEventHandler('keyup', event);

        await fixture.whenStable();
        expect(verifyAndAccessSpy).toHaveBeenCalled();
    });

    it('should return false and set error message if username of a player is empty', async () => {
        component.givenUsername = '';
        const isValid = await component['isUsernameValid']();
        expect(isValid).toBeFalse();
        expect(component.nameErrorMessage).toEqual('Veuillez entrer un nom d’utilisateur valide.');
    });

    it('should return false and set error message if the username is not valid', async () => {
        const testUsername = 'invalidUsername';
        mockRoomCommunicationService.processUsername.and.returnValue(of(false));
        component.givenRoomCode = roomIdMock;
        component.givenUsername = testUsername;

        const isValid = await component['isUsernameValid']();
        expect(isValid).toBeFalse();
        expect(mockRoomCommunicationService.processUsername).toHaveBeenCalledWith(roomIdMock, {
            name: testUsername,
            socketId: mockSocketClientService.socket.id,
        });
    });

    it('should return true if username is valid and not taken', async () => {
        const testUsername = 'validUser';
        mockRoomCommunicationService.processUsername.and.returnValue(of(true));
        component.givenRoomCode = roomIdMock;
        component.givenUsername = testUsername;

        const isValid = await component['isUsernameValid']();
        expect(isValid).toBeTrue();
        expect(mockRoomCommunicationService.processUsername).toHaveBeenCalledWith(roomIdMock, {
            name: testUsername,
            socketId: mockSocketClientService.socket.id,
        });
    });

    it('should validate the room code and show username field if code is OK', async () => {
        component.givenRoomCode = roomIdMock;

        mockRoomCommunicationService.joinRoom.and.returnValue(of(mockJoinRoomResponseOK));
        await component.checkCode();

        expect(component.showUsernameField).toBeTrue();
        expect(component.isCodeValidated).toBeTrue();
        expect(component.roomCodeErrorMessage).toBe('');
    });

    it('should display an error message if the room is locked', async () => {
        const mockJoinRoomResponseLocked = {
            roomState: 'IS_LOCKED',
            quiz: { id: 'mockedId' } as Quiz,
        };
        component.givenRoomCode = roomIdMock;
        mockRoomCommunicationService.joinRoom.and.returnValue(of(mockJoinRoomResponseLocked));
        await component.checkCode();

        expect(component.roomCodeErrorMessage).toBe('La partie est verrouillée.');
        expect(component.showUsernameField).toBeFalse();
    });

    it('should display an error message if the room does not exist (invalid)', async () => {
        const mockJoinRoomResponseInvalid = {
            roomState: 'INVALID',
            quiz: { id: 'mockedId' } as Quiz,
        };
        component.givenRoomCode = roomIdMock;
        mockRoomCommunicationService.joinRoom.and.returnValue(of(mockJoinRoomResponseInvalid));
        await component.checkCode();

        expect(component.roomCodeErrorMessage).toBe('Code invalide.');
        expect(component.showUsernameField).toBeFalse();
    });

    it('should display an error message as default', async () => {
        component.givenRoomCode = roomIdMock;
        mockRoomCommunicationService.joinRoom.and.returnValue(of(mockJoinRoomResponse));
        await component.checkCode();

        expect(component.roomCodeErrorMessage).toBe('Une erreur est survenue.');
        expect(component.showUsernameField).toBeFalse();
    });

    it('should display an error message if the room code is longer than 4 numbers', async () => {
        component.givenRoomCode = 'codeTooLong';
        await component.checkCode();

        expect(component.roomCodeErrorMessage).toBe('Code à 4 chiffres requis.');
        expect(component.showUsernameField).toBeFalse();
    });

    it('should not allow access if RoomState is not OK', async () => {
        mockRoomCommunicationService.joinRoom.and.returnValue(of(mockJoinRoomResponse));
        await component.verifyAndAccess();

        expect(component.isCodeValidated).toBeFalse();
        expect(component.showUsernameField).toBeFalse();
        expect(component.roomCodeErrorMessage).toEqual('La partie est verrouillée ou n’existe plus.');
    });

    it('should not navigate if username is invalid', async () => {
        mockRoomCommunicationService.joinRoom.and.returnValue(of(mockJoinRoomResponseOK));
        mockRoomCommunicationService.processUsername.and.returnValue(of(false));
        await component.verifyAndAccess();
        expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should navigate to the room if the username of a player is valid', async () => {
        component.givenRoomCode = roomIdMock;
        component.givenUsername = 'validUsername';

        mockRoomCommunicationService.joinRoom.and.returnValue(of(mockJoinRoomResponseOK));
        mockRoomCommunicationService.processUsername.and.returnValue(of(true));
        await component.verifyAndAccess();
        expect(mockSocketClientService.send).toHaveBeenCalledWith(JoinEvents.SuccessfulJoin, {
            roomId: roomIdMock,
            name: 'validUsername',
        });

        expect(mockSocketClientService.send).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(`/waiting/game/${component['quizId']}/room/${roomIdMock}`);
    });

    it('should close the popup if user cancels', () => {
        const cancelButton = fixture.debugElement.nativeElement.querySelector('#cancel');
        spyOn(component, 'closeAdminPopup').and.callThrough();

        cancelButton.click();
        fixture.detectChanges();

        expect(component.closeAdminPopup).toHaveBeenCalled();
        expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should not prevent default action for control keys', () => {
        const controlKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'];
        controlKeys.forEach((key) => {
            const event: KeyboardEvent = new KeyboardEvent('keydown', { key });
            spyOn(event, 'preventDefault');
            component.allowNumbersOnly(event);
            expect(event.preventDefault).not.toHaveBeenCalled();
        });
    });

    it('should not prevent default action for numeric keys', () => {
        const numbersAllowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        numbersAllowedKeys.forEach((key) => {
            const event: KeyboardEvent = new KeyboardEvent('keydown', { key });
            spyOn(event, 'preventDefault');
            component.allowNumbersOnly(event);
            expect(event.preventDefault).not.toHaveBeenCalled();
        });
    });

    it('should prevent default action for symbols', () => {
        const symbolsNotAllowedKeys = ['!', '@', '#', '$', '%', '?', '&', '*', '-', '_', '+', '='];

        symbolsNotAllowedKeys.forEach((key) => {
            const event: KeyboardEvent = new KeyboardEvent('keydown', { key });
            spyOn(event, 'preventDefault');
            component.allowNumbersOnly(event);
            expect(event.preventDefault).toHaveBeenCalled();
        });
    });

    it('should prevent default action for letters', () => {
        const lettersNotAllowedKeys = ['A', 'Z', 'a', 'z'];

        lettersNotAllowedKeys.forEach((key) => {
            const event: KeyboardEvent = new KeyboardEvent('keydown', { key });
            spyOn(event, 'preventDefault');
            component.allowNumbersOnly(event);
            expect(event.preventDefault).toHaveBeenCalled();
        });
    });
});
