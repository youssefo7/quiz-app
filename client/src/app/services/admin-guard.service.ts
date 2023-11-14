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
    canAccessAdmin: boolean;
    private readonly baseUrl: string;

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
            sessionStorage.setItem(SessionKeys.CanAccessAdmin, 'true');
            return this.canAccessAdmin;
        } catch (error) {
            this.canAccessAdmin = false;
            return this.canAccessAdmin;
        }
    }

    async submitPassword(userPassword: string) {
        await firstValueFrom(this.http.post(`${this.baseUrl}/admin/login`, { password: userPassword }));
    }

    canActivate(): boolean {
        const navigation = this.router.getCurrentNavigation();
        let prevUrl: string | null = null;

        if (navigation?.trigger === 'imperative') {
            const previousNavigation = this.router.getCurrentNavigation()?.previousNavigation;
            if (previousNavigation) {
                prevUrl = previousNavigation.extractedUrl.toString();
            }
        }

        const validURL = [null, '/quiz/new', '/home', '/'].includes(prevUrl) || (prevUrl && /\/quiz\/\d+/.test(prevUrl));

        if (this.canAccessAdmin && validURL) {
            return true;
        }

        this.router.navigate(['/home']);
        return false;
    }

    pageRefreshState(): void {
        if (sessionStorage.getItem(SessionKeys.IsRefreshed)) {
            sessionStorage.setItem(SessionKeys.ShowPasswordPopup, 'true');
            this.router.navigateByUrl('/home');
        } else {
            sessionStorage.setItem(SessionKeys.IsRefreshed, 'true');
        }
    }

    grantAccess(): void {
        this.canAccessAdmin = true;
        sessionStorage.setItem(SessionKeys.CanAccessAdmin, 'true');
    }
}
