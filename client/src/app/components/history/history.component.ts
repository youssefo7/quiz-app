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
    isNameAscending: boolean;
    isDateAscending: boolean;
    isHistoryEmpty: boolean;
    isSortingByName: boolean;
    private nameSortDirection: SortDirection;
    private dateSortDirection: SortDirection;

    constructor(
        private readonly historyCommunicationService: HistoryCommunicationService,
        private popUp: MatDialog,
    ) {
        this.nameSortDirection = SortDirection.ASCENDING;
        this.dateSortDirection = SortDirection.ASCENDING;
        this.isNameAscending = true;
        this.isDateAscending = true;
        this.isHistoryEmpty = true;
        this.isSortingByName = false;
    }

    async ngOnInit() {
        this.loadHistory();
    }

    sortHistory(type: string) {
        if (type === SortType.NAME) {
            this.isNameAscending = this.nameSortDirection !== SortDirection.ASCENDING;
            this.nameSortDirection = this.isNameAscending ? SortDirection.ASCENDING : SortDirection.DESCENDING;
            this.isSortingByName = true;
        } else if (type === SortType.DATE) {
            this.isDateAscending = this.dateSortDirection !== SortDirection.ASCENDING;
            this.dateSortDirection = this.isDateAscending ? SortDirection.ASCENDING : SortDirection.DESCENDING;
            this.isSortingByName = false;
        }

        this.history.sort((a, b) => {
            if (type === SortType.NAME) {
                return this.nameSortDirection === SortDirection.ASCENDING ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            } else {
                return this.dateSortDirection === SortDirection.ASCENDING ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
            }
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
        if (!this.isHistoryEmpty) {
            this.sortHistory(SortType.DATE);
        }
    }
}
