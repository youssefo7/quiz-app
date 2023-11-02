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
    @Post('/name')
    handleChooseName(@Body() data: { name: string; roomId: string; socketId: string }, @Res() response: Response) {
        try {
            const isNameValid = this.roomManagerService.processUsername({ name: data.name, roomId: data.roomId, socketId: data.socketId });
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
    @Post('/join')
    handleJoinRoom(@Body() data: { roomId: string; socketId: string }, @Res() response: Response) {
        try {
            const roomState = this.roomManagerService.processJoinRoom({ roomId: data.roomId, socketId: data.socketId });
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
        description: 'Returns room id',
        type: Boolean,
    })
    @ApiNotFoundResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Get('/:id/players')
    handleGetPlayers(@Param('id') id: string, @Res() response: Response) {
        try {
            const players = this.roomManagerService.getRoomPlayers(id);
            response.status(HttpStatus.OK).send(players);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json('Erreur lors de la récupération des joueurs');
        }
    }
}
