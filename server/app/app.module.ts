import { AdminGuardController } from '@app/controllers/admin-guard/admin-guard.controller';
import { QuizzesController } from '@app/controllers/quizzes/quizzes.controller';
import { Quiz, quizSchema } from '@app/model/database/quiz';
import { AdminGuardService } from '@app/services/admin-guard/admin-guard.service';
import { QuizzesService } from '@app/services/quizzes/quizzes.service';
import { Logger, Module } from '@nestjs/common';
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
        MongooseModule.forFeature([{ name: Quiz.name, schema: quizSchema }]),
    ],
    controllers: [QuizzesController, AdminGuardController],
    providers: [Logger, AdminGuardService, QuizzesService],
})
export class AppModule {}
