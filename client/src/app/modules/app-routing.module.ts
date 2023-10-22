import { NgModule } from '@angular/core';
import { mapToCanActivate, RouterModule, Routes } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { CreateEditQuizPageComponent, exitCreateEditQuizPageGuard } from '@app/pages/create-edit-quiz-page/create-edit-quiz-page.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { WaitingPageComponent } from '@app/pages/waiting-page/waiting-page.component';
import { AdminGuardService } from '@app/services/admin-guard.service';
const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'game/new', component: CreateGamePageComponent },
    { path: 'game/:id', component: GamePageComponent },
    { path: 'admin', component: AdminPageComponent, canActivate: mapToCanActivate([AdminGuardService]) },
    { path: 'game/:id/test', component: GamePageComponent },
    { path: 'quiz/new', component: CreateEditQuizPageComponent, canDeactivate: [exitCreateEditQuizPageGuard] },
    { path: 'quiz/:id', component: CreateEditQuizPageComponent, canDeactivate: [exitCreateEditQuizPageGuard] },
    { path: 'waiting', component: WaitingPageComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
