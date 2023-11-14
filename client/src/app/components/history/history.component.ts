import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { History } from '@app/interfaces/history';
import { PopupMessageConfig } from '@app/interfaces/popup-message-config';
import { HistoryCommunicationService } from '@app/services/history-communication.service';
import { firstValueFrom } from 'rxjs';

enum SortDirection {
    ASCENDING = 'asc',
    DESCENDING = 'desc',
}

enum SortType {
    NAME = 'name',
    DATE = 'date',
}

@Component({
    selector: 'app-history',
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit {
    history: History[];
    isNameAscending;
    isDateAscending;
    isHistoryEmpty;
    private sortDirection;

    constructor(
        private readonly historyCommunicationService: HistoryCommunicationService,
        private popUp: MatDialog,
    ) {
        this.sortDirection = SortDirection.ASCENDING;
        this.isNameAscending = true;
        this.isDateAscending = true;
        this.isHistoryEmpty = true;
    }

    async ngOnInit() {
        this.loadHistory();
    }

    sort(type: string) {
        if (type === SortType.NAME) {
            this.isNameAscending = this.sortDirection === SortDirection.ASCENDING ? false : true;
            this.sortDirection = this.isNameAscending ? SortDirection.ASCENDING : SortDirection.DESCENDING;
        } else if (type === SortType.DATE) {
            this.isDateAscending = this.sortDirection === SortDirection.ASCENDING ? false : true;
            this.sortDirection = this.isDateAscending ? SortDirection.ASCENDING : SortDirection.DESCENDING;
        }

        this.history.sort((a, b) => {
            if (type === SortType.NAME) {
                return this.sortDirection === SortDirection.ASCENDING ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            } else if (type === SortType.DATE) {
                return this.sortDirection === SortDirection.ASCENDING ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
            }
            return 0;
        });
    }

    openDeleteHistoryPopUp() {
        const config: PopupMessageConfig = {
            message: "Êtes-vous sûr de vouloir supprimer tout l'historique?",
            hasCancelButton: true,
            okButtonFunction: async () => {
                await firstValueFrom(this.historyCommunicationService.deleteAllHistory());
                await this.loadHistory();
            },
        };
        const dialogRef = this.popUp.open(PopupMessageComponent);
        const popupInstance = dialogRef.componentInstance;
        popupInstance.config = config;
    }

    private async loadHistory() {
        this.history = await firstValueFrom(this.historyCommunicationService.getAllHistory());
        this.isHistoryEmpty = this.history.length === 0;
    }
}
