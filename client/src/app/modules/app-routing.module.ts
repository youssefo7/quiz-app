import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { CreateEditQuizPageComponent, exitCreateEditQuizPageGuard } from '@app/pages/create-edit-quiz-page/create-edit-quiz-page.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { HostGamePageComponent } from '@app/pages/host-game-page/host-game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { WaitingPageComponent } from '@app/pages/waiting-page/waiting-page.component';
import { AdminGuardService } from '@app/services/admin-guard.service';
import { QuizGuardService } from '@app/services/quiz-guard.service';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'admin', component: AdminPageComponent, canActivate: [AdminGuardService] },
    { path: 'game/new', component: CreateGamePageComponent },
    { path: 'game/:quizId/test', component: GamePageComponent },
    { path: 'game/:quizId/room/:roomId/host', component: HostGamePageComponent },
    { path: 'game/:quizId/room/:roomId', component: GamePageComponent },
    { path: 'quiz/new', component: CreateEditQuizPageComponent, canDeactivate: [exitCreateEditQuizPageGuard], canActivate: [QuizGuardService] },
    { path: 'quiz/:id', component: CreateEditQuizPageComponent, canDeactivate: [exitCreateEditQuizPageGuard], canActivate: [QuizGuardService] },
    { path: 'waiting/game/:quizId/room/:roomId/host', component: WaitingPageComponent },
    { path: 'waiting/game/:quizId/room/:roomId', component: WaitingPageComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
