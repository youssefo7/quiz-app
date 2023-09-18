import { NgModule } from '@angular/core';
import { RouterModule, Routes, mapToCanActivate } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { HostGamePageComponent } from '@app/pages/host-game-page/host-game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { AdminGuardService } from '@app/services/admin-guard.service';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'game/:id', component: GamePageComponent },
    { path: 'admin', component: AdminPageComponent, canActivate: mapToCanActivate([AdminGuardService]) },
    { path: 'game/host', component: HostGamePageComponent },
    { path: 'material', component: MaterialPageComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
