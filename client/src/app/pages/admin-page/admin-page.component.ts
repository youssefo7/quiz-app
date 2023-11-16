import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AdminGuardService } from '@app/services/admin-guard.service';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss', '../../../assets/shared.scss'],
})
export class AdminPageComponent implements OnInit {
    constructor(
        private router: Router,
        private adminGuardService: AdminGuardService,
    ) {
        this.handleAdminPageExit();
    }

    ngOnInit() {
        const canActivate = !this.adminGuardService.canActivate();
        if (canActivate) {
            this.router.navigateByUrl('/home');
        }
        this.adminGuardService.pageRefreshState();
    }

    private handleAdminPageExit() {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd && event.url !== '/admin') {
                sessionStorage.removeItem('isRefreshed');
                sessionStorage.removeItem('canAccessAdmin');
                this.adminGuardService.canAccessAdmin = false;
            }
        });
    }
}
