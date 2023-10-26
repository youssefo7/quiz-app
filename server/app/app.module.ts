import { AdminGuardController } from '@app/controllers/admin-guard/admin-guard.controller';
import { QuizzesController } from '@app/controllers/quizzes/quizzes.controller';
import { Quiz, quizSchema } from '@app/model/database/quiz';
import { AdminGuardService } from '@app/services/admin-guard/admin-guard.service';
import { QuizzesService } from '@app/services/quizzes/quizzes.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './gateway/chat/chat.gateway';
import { GameGateway } from './gateway/game/game.gateway';
import { JoinGateway } from './gateway/join/join.gateway';
import { WaitingGateway } from './gateway/waiting/waiting.gateway';
import { RoomManagerService } from './services/room-manager/room-manager.service';

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
    providers: [Logger, AdminGuardService, QuizzesService, RoomManagerService, GameGateway, ChatGateway, WaitingGateway, JoinGateway],
})
export class AppModule {}
