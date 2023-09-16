// Code provided by: Kamil Myśliwiec
// https://github.com/vladwulf/nestjs-logger-tutorial/blob/main/src/utils/logger.middleware.ts
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');

    use(request: Request, response: Response, next: NextFunction): void {
        const { method, originalUrl, body } = request;

        response.on('finish', () => {
            const { statusCode } = response;
            const bodyString = JSON.stringify(body, null, 2);

            this.logger.log(`${method} ${originalUrl} ${statusCode} \n ${bodyString}`);
        });

        next();
    }
}
