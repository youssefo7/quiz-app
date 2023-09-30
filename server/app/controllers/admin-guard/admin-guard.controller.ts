import { AdminGuardService } from '@app/services/admin-guard/admin-guard.service';
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('AdminGuard')
@Controller('admin')
export class AdminGuardController {
    constructor(private adminGuardService: AdminGuardService) {}

    @ApiOkResponse({
        description: 'Returns password validation response',
        type: Boolean,
    })
    @ApiNotFoundResponse({
        description: 'Return FORBIDDEN http status when request fails',
    })
    @Post('/login')
    async isAccessAdmin(@Body() body: { password: string }, @Res() response: Response) {
        try {
            this.adminGuardService.isAccessGranted(body.password);
            response.status(HttpStatus.OK).json({ message: 'access is granted' });
        } catch (error) {
            if (error.message === 'access is not granted') {
                response.status(HttpStatus.FORBIDDEN).json({ message: error.message });
            } else {
                response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
            }
        }
    }
}
