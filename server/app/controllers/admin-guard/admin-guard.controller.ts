import { AdminGuardService } from '@app/services/admin-guard/admin-guard.service';
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('AdminGuard')
@Controller('admin')
export class AdminGuardController {
    constructor(private adimnGuardService: AdminGuardService) {}

    @ApiOkResponse({
        description: 'Returns Quizzes list',
        type: Boolean,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Post('/login')
    async isAccessAdmin(@Body() { password: value }, @Res() response: Response) {
        try {
            await this.adimnGuardService.isAccessGranted(value);
            response.status(HttpStatus.OK).json({ message: 'access is granted' });
        } catch (error) {
            response.status(HttpStatus.FORBIDDEN).send({ message: 'access is not granted' });
        }
    }
}
