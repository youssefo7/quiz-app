import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AdminGuardService {
    // TODO : see if we want some sort of history for the user
    // for example, if they provided the password once, do we always allow access?

    private canAccessAdmin: boolean;

    constructor() {
        this.canAccessAdmin = false;
    }

    isAccessGranted(userPassword: string) {
        // TODO : make service to verify authentication in backend
        this.canAccessAdmin = userPassword === 'ultimate!!!password';
        return this.canAccessAdmin;
    }

    canActivate() {
        // return true to allow user to navigate to admin page
        return this.canAccessAdmin;
    }
}
