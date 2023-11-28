import { History } from '@app/model/database/history';
import { HistoryService } from '@app/services/history/history.service';
import { Body, Controller, Delete, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('History')
@Controller('history')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}

    @ApiOkResponse({
        description: 'Add game to History',
        type: History,
    })
    @ApiBadRequestResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Post('/')
    async addHistory(@Body() newHistory: History, @Res() response: Response) {
        try {
            const history = await this.historyService.addToHistory(newHistory);
            response.status(HttpStatus.CREATED).json(history);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Erreur lors de l'ajout de l'historique");
        }
    }

    @ApiOkResponse({
        description: 'Get the History',
        type: History,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/')
    async getAllHistory(@Res() response: Response) {
        try {
            const history = await this.historyService.getAllHistory();
            response.status(HttpStatus.OK).json(history);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send("Erreur lors de la récupération de l'historique");
        }
    }

    @ApiOkResponse({
        description: 'Delete the History',
        type: String,
    })
    @ApiBadRequestResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Delete('/')
    async deleteAllHistory(@Res() response: Response) {
        try {
            await this.historyService.deleteAllHistory();
            response.status(HttpStatus.OK).json('Historique supprimé');
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Erreur lors de la suppression de l'historique");
        }
    }
}
