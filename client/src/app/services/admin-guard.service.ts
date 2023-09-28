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
    private readonly baseUrl: string;

    constructor(private readonly http: HttpClient) {
        this.canAccessAdmin = false;
        this.baseUrl = environment.serverUrl;
    }

    async isAccessGranted(userPassword: string) {
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
