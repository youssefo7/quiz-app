import { RoomManagerService } from '@app/services/room-manager/room-manager.service';
import { Body, Controller, Get, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomController {
    constructor(private readonly roomManagerService: RoomManagerService) {}

    @ApiOkResponse({
        description: 'Returns name validation',
        type: Boolean,
    })
    @ApiNotFoundResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Post('/:roomId/name')
    handleChooseName(@Param('roomId') roomId: string, @Body() body: { name: string; socketId: string }, @Res() response: Response) {
        try {
            const isNameValid = this.roomManagerService.processUsername({ name: body.name, roomId, socketId: body.socketId });
            response.status(HttpStatus.OK).json(isNameValid);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json('Erreur lors de la validation du nom');
        }
    }

    @ApiOkResponse({
        description: 'Returns room state',
        type: Boolean,
    })
    @ApiNotFoundResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Post('/:roomId/join')
    handleJoinRoom(@Param('roomId') roomId: string, @Body() body: { socketId: string }, @Res() response: Response) {
        try {
            const roomState = this.roomManagerService.processJoinRoom({ roomId, socketId: body.socketId });
            response.status(HttpStatus.OK).json(roomState);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json('Erreur lors de la validation de la salle');
        }
    }

    @ApiOkResponse({
        description: 'Returns room id',
        type: Boolean,
    })
    @ApiNotFoundResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Post('/new')
    handleCreateRoom(@Body() data: { quizId: string; socketId: string }, @Res() response: Response) {
        try {
            const roomId = this.roomManagerService.createNewRoom(data.quizId, data.socketId);
            response.status(HttpStatus.OK).send(roomId);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json('Erreur lors de la création de la salle');
        }
    }

    @ApiOkResponse({
        description: 'Returns player names in room',
        type: Boolean,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/:roomId/players')
    handleGetPlayers(@Param('roomId') roomId: string, @Res() response: Response) {
        try {
            const players = this.roomManagerService.getRoomPlayers(roomId);
            response.status(HttpStatus.OK).send(players);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).json(`Erreur lors de la récupération des joueurs de la salle ${roomId}`);
        }
    }

    @ApiOkResponse({
        description: 'Returns player name in room',
        type: Boolean,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Post('/:roomId/playerName')
    handleGetName(@Param('roomId') roomId: string, @Body() data: { socketId: string }, @Res() response: Response) {
        try {
            const name = this.roomManagerService.getPlayerName(roomId, data.socketId);
            response.status(HttpStatus.OK).json(name);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).json(`Erreur lors de la récupération du nom du joueur ${data.socketId} de la salle ${roomId}`);
        }
    }
}
