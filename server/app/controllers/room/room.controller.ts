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
    handleChooseName(@Body() body: { name: string; roomId: string; socketId: string }, @Res() response: Response) {
        try {
            const isNameValid = this.roomManagerService.processUsername({ name: body.name, roomId: body.roomId, socketId: body.socketId });
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
    handleJoinRoom(@Body() body: { roomId: string; socketId: string }, @Res() response: Response) {
        try {
            const roomState = this.roomManagerService.processJoinRoom({ roomId: body.roomId, socketId: body.socketId });
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
    handleCreateRoom(@Body() body: { quizId: string; socketId: string }, @Res() response: Response) {
        try {
            const roomId = this.roomManagerService.createNewRoom(body.quizId, body.socketId);
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
}
