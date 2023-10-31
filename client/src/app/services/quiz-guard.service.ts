import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AdminGuardService } from '@app/services/admin-guard.service';

@Injectable({
    providedIn: 'root',
})
export class QuizGuardService {
    constructor(
        private router: Router,
        private adminGuardService: AdminGuardService,
    ) {}

    canActivate(): boolean {
        const navigation = this.router.getCurrentNavigation();
        let prevUrl: string | null = null;

        if (navigation && navigation.trigger === 'imperative') {
            const previousNavigation = navigation.previousNavigation;
            if (previousNavigation) {
                prevUrl = previousNavigation.extractedUrl.toString();
            }
        }

        const canAccessQuiz = prevUrl === null && this.adminGuardService.canAccessAdmin;

        if (prevUrl === '/admin' || canAccessQuiz) {
            return true;
        }

        this.router.navigate(['/home']);
        return false;
    }
}
