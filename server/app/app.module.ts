import { QuizzesController } from '@app/controllers/quizzes/quizzes.controller';
import { QuizzesService } from '@app/services/quizzes/quizzes.service';
import { LoggerMiddleware } from '@app/utils/logger.middleware';
import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'), // Loaded from .env
            }),
        }),
        // MongooseModule.forFeature([{ name: Course.name, schema: courseSchema }]),
    ],
    controllers: [QuizzesController],
    providers: [Logger, QuizzesService],
})

// Code provided by: Kamil Myśliwiec
// https://github.com/vladwulf/nestjs-logger-tutorial/blob/main/src/utils/logger.middleware.ts
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
