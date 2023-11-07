import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { GameEvents } from '@app/events/game.events';
import { JoinEvents } from '@app/events/join.events';
import { RoomCommunicationService } from '@app/services/room-communication.service';
import { SocketClientService } from '@app/services/socket-client.service';
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
        quizId: '',
    };

    const mockJoinRoomResponseOK = {
        roomState: 'OK',
        quizId: 'mockId',
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

    it('should handle enter press when code is not valid', async () => {
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

    it('should return false and set error message if username is empty', async () => {
        component.givenUsername = '';
        const isValid = await component.isUsernameValid();
        expect(isValid).toBeFalse();
        expect(component.nameErrorMessage).toEqual('Veuillez entrer un nom d’utilisateur valide.');
    });

    it('should return false and set error message if the username is not valid', async () => {
        const testUsername = 'invalidUsername';
        mockRoomCommunicationService.processUsername.and.returnValue(of(false));
        component.givenRoomCode = roomIdMock;
        component.givenUsername = testUsername;

        const isValid = await component.isUsernameValid();
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

        const isValid = await component.isUsernameValid();
        expect(isValid).toBeTrue();
        expect(mockRoomCommunicationService.processUsername).toHaveBeenCalledWith(roomIdMock, {
            name: testUsername,
            socketId: mockSocketClientService.socket.id,
        });
    });

    it('should validate code and show username field if code is OK', async () => {
        component.givenRoomCode = roomIdMock;

        mockRoomCommunicationService.joinRoom.and.returnValue(of(mockJoinRoomResponseOK));
        await component.checkCode();

        expect(component.showUsernameField).toBeTrue();
        expect(component.isCodeValidated).toBeTrue();
        expect(component.roomCodeErrorMessage).toBe('');
        expect(mockSocketClientService.send).toHaveBeenCalledWith(JoinEvents.JoinRoom, roomIdMock);
    });

    it('should display an error message if room is locked', async () => {
        const mockJoinRoomResponseLocked = {
            roomState: 'IS_LOCKED',
            quizId: 'mockId',
        };
        component.givenRoomCode = roomIdMock;
        mockRoomCommunicationService.joinRoom.and.returnValue(of(mockJoinRoomResponseLocked));
        await component.checkCode();

        expect(component.roomCodeErrorMessage).toBe('La partie est verrouillée.');
        expect(component.showUsernameField).toBeFalse();
    });

    it('should display an error message if room is invalid', async () => {
        const mockJoinRoomResponseInvalid = {
            roomState: 'INVALID',
            quizId: 'mockId',
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

    it('should display an error message if code is longer than 4 numbers', async () => {
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

    it('should navigate if username is invalid', async () => {
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

    it('should close the dialog and send the player leave join game if user cancels', () => {
        const cancelButton = fixture.debugElement.nativeElement.querySelector('#cancel');
        spyOn(component, 'closeAdminPopup').and.callThrough();

        cancelButton.click();
        fixture.detectChanges();

        expect(component.closeAdminPopup).toHaveBeenCalled();
        expect(mockDialogRef.close).toHaveBeenCalled();
        expect(mockSocketClientService.send).toHaveBeenCalledWith(GameEvents.PlayerLeaveGame, {
            roomId: component.givenRoomCode,
            isInGame: false,
        });
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

    it('should prevent default action for non-allowed keys', () => {
        const symbolsNotAllowedKeys = ['!', '@', '#', '$', '%', '?', '&', '*', '-', '_', '+', '='];

        symbolsNotAllowedKeys.forEach((key) => {
            const event: KeyboardEvent = new KeyboardEvent('keydown', { key });
            spyOn(event, 'preventDefault');
            component.allowNumbersOnly(event);
            expect(event.preventDefault).toHaveBeenCalled();
        });
    });

    it('should prevent default action for non-allowed keys', () => {
        const lettersNotAllowedKeys = ['A', 'Z', 'a', 'z'];

        lettersNotAllowedKeys.forEach((key) => {
            const event: KeyboardEvent = new KeyboardEvent('keydown', { key });
            spyOn(event, 'preventDefault');
            component.allowNumbersOnly(event);
            expect(event.preventDefault).toHaveBeenCalled();
        });
    });
});
