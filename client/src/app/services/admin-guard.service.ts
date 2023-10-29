import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

export enum SessionKeys {
    IsRefreshed = 'isRefreshed',
    ShowPasswordPopup = 'showPasswordPopup',
    CanAccessAdmin = 'canAccessAdmin',
}

@Injectable({
    providedIn: 'root',
})
export class AdminGuardService {
    private canAccessAdmin: boolean;
    private readonly baseUrl: string;
    private accessViaPopup: boolean = false;

    constructor(
        private http: HttpClient,
        private router: Router,
    ) {
        this.canAccessAdmin = sessionStorage.getItem(SessionKeys.CanAccessAdmin) ? true : false;
        this.baseUrl = environment.serverUrl;
    }

    async isAccessGranted(userPassword: string) {
        try {
            await this.submitPassword(userPassword);
            this.canAccessAdmin = true;
            this.accessViaPopup = true;
            return this.canAccessAdmin;
        } catch (error) {
            this.canAccessAdmin = false;
            this.accessViaPopup = false;
            return this.canAccessAdmin;
        }
    }

    async submitPassword(userPassword: string) {
        await firstValueFrom(this.http.post(`${this.baseUrl}/admin/login`, { password: userPassword }));
    }

    canActivate() {
        if (!this.accessViaPopup) {
            this.router.navigateByUrl('/home');
            return false;
        }
        return this.canAccessAdmin;
    }

    pageRefreshState(): void {
        if (!sessionStorage.getItem(SessionKeys.IsRefreshed)) {
            this.accessViaPopup = false;
            sessionStorage.setItem(SessionKeys.IsRefreshed, 'true');
        }
    }

    showAdminPopup(): boolean {
        const shouldShow = sessionStorage.getItem(SessionKeys.ShowPasswordPopup);
        if (shouldShow) {
            sessionStorage.removeItem(SessionKeys.ShowPasswordPopup);
            return true;
        }
        return false;
    }
}
