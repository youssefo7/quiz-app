import { Quiz } from '@app/model/database/quiz';
import { QuizzesService } from '@app/services/quizzes/quizzes.service';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Quizzes')
@Controller('quizzes')
export class QuizzesController {
    constructor(private readonly quizzesService: QuizzesService) {}

    @ApiOkResponse({
        description: 'Returns Quizzes list',
        type: Quiz,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/')
    async getQuizzes(@Res() response: Response) {
        try {
            const list = await this.quizzesService.getQuizzes();
            response.status(HttpStatus.OK).json(list);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Returns a Quiz from list',
        type: Quiz,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/:id')
    async getQuiz(@Param('id') id: string, @Res() response: Response) {
        try {
            const quiz = await this.quizzesService.getQuiz(id);
            response.status(HttpStatus.OK).json(quiz);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }
    @ApiCreatedResponse({
        description: 'Adds Quiz to the list',
        type: Quiz,
    })
    @ApiNotFoundResponse({
        description: 'Return BAD_REQUEST http status when request fails',
    })
    @Post('/')
    async addQuiz(@Body() newQuiz: Quiz, @Res() response: Response) {
        try {
            const quiz = await this.quizzesService.addQuiz(newQuiz);
            response.status(HttpStatus.CREATED).json(quiz);
        } catch (error) {
            response.status(HttpStatus.BAD_REQUEST).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Updates a Quiz in the list',
        type: Quiz,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Put('/:id')
    async updateQuiz(@Param('id') id: string, @Body() updatedQuiz: Quiz, @Res() response: Response) {
        try {
            const quiz = await this.quizzesService.updateQuiz(id, updatedQuiz);
            response.status(HttpStatus.OK).json(quiz);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Deletes a Quiz in list',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Delete('/:id')
    async deleteQuiz(@Param('id') id: string, @Res() response: Response) {
        try {
            await this.quizzesService.deleteQuiz(id);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }
}
