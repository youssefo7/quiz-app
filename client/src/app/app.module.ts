import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { AdminPopupComponent } from './components/admin-popup/admin-popup.component';
import { ChatComponent } from './components/chat/chat.component';
import { ConfirmationPopUpComponent } from './components/confirmation-pop-up/confirmation-pop-up.component';
import { CountdownComponent } from './components/countdown/countdown.component';
import { CreateGameListComponent } from './components/create-game-list/create-game-list.component';
import { ImportPopupComponent } from './components/import-popup/import-popup.component';
import { PopupMessageComponent } from './components/popup-message/popup-message.component';
import { ProfileComponent } from './components/profile/profile.component';
import { QuestionZoneComponent } from './components/question-zone/question-zone.component';
import { QuizGeneralInfoComponent } from './components/quiz-general-info/quiz-general-info.component';
import { QuizListComponent } from './components/quiz-list/quiz-list.component';
import { QuizQuestionInfoComponent } from './components/quiz-question-info/quiz-question-info.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { RangeValidatorDirective } from './directives/range-validator.directive';
import { TitleExistsDirective } from './directives/title-exists.directive';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { CreateGamePageComponent } from './pages/create-game-page/create-game-page.component';
import { CreateQuizPageComponent } from './pages/create-quiz-page/create-quiz-page.component';
import { HostGamePageComponent } from './pages/host-game-page/host-game-page.component';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        MainPageComponent,
        MaterialPageComponent,
        PlayAreaComponent,
        SidebarComponent,
        AdminPageComponent,
        HostGamePageComponent,
        TopBarComponent,
        CreateQuizPageComponent,
        QuizGeneralInfoComponent,
        RangeValidatorDirective,
        QuizQuestionInfoComponent,
        TitleExistsDirective,
        RangeValidatorDirective,
        ConfirmationPopUpComponent,
        QuizListComponent,
        AdminPopupComponent,
        ProfileComponent,
        CreateGameListComponent,
        CreateGamePageComponent,
        ChatComponent,
        CountdownComponent,
        PopupMessageComponent,
        ImportPopupComponent,
        QuestionZoneComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        ReactiveFormsModule,
        MatDialogModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
