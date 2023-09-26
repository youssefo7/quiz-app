import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AdminGuardService {
    // TODO : see if we want some sort of history for the user
    // for example, if they provided the password once, do we always allow access?

    private canAccessAdmin: boolean;
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private readonly http: HttpClient) {
        this.canAccessAdmin = false;
    }

    async isAccessGranted(userPassword: string) {
        // TODO : make service to verify authentication in backend
        try {
            await this.submitPassword(userPassword);
            this.canAccessAdmin = true;
            return this.canAccessAdmin;
        } catch (error) {
            this.canAccessAdmin = false;
            return this.canAccessAdmin;
        }
    }

    async submitPassword(userPassword: string) {
        await firstValueFrom(this.http.post(`${this.baseUrl}/admin/login`, { password: userPassword }));
    }

    canActivate() {
        // return true to allow user to navigate to admin page
        return this.canAccessAdmin;
    }
}
