import { NgModule } from '@angular/core';
import { mapToCanActivate, RouterModule, Routes } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { CreateQuizPageComponent } from '@app/pages/create-quiz-page/create-quiz-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { AdminGuardService } from '@app/services/admin-guard.service';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'game/new', component: CreateGamePageComponent },
    { path: 'game/:id', component: GamePageComponent },
    { path: 'admin', component: AdminPageComponent, canActivate: mapToCanActivate([AdminGuardService]) },
    { path: 'game/:id/test', component: GamePageComponent },
    { path: 'material', component: MaterialPageComponent },
    { path: 'quiz/new', component: CreateQuizPageComponent },
    { path: 'quiz/:id', component: CreateQuizPageComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
