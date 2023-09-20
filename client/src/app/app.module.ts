import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { HostGamePageComponent } from './pages/host-game-page/host-game-page.component';
import { CreateGameListComponent } from './components/create-game-list/create-game-list.component';
import { AdminPopupComponent } from './components/admin-popup/admin-popup.component';
import { CreateGameListComponent } from './components/create-game-list/create-game-list.component';

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
        CreateGameListComponent,
        AdminPopupComponent,
        CreateGameListComponent,
    ],
    imports: [AppMaterialModule, AppRoutingModule, BrowserAnimationsModule, BrowserModule, FormsModule, HttpClientModule, MatDialogModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
