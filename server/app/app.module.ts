import { AdminGuardController } from '@app/controllers/admin-guard/admin-guard.controller';
import { HistoryController } from '@app/controllers/history/history.controller';
import { QuizzesController } from '@app/controllers/quizzes/quizzes.controller';
import { TimeGateway } from '@app/gateway/time/time.gateway';
import { History, historySchema } from '@app/model/database/history';
import { Quiz, quizSchema } from '@app/model/database/quiz';
import { AdminGuardService } from '@app/services/admin-guard/admin-guard.service';
import { HistoryService } from '@app/services/history/history.service';
import { QuizzesService } from '@app/services/quizzes/quizzes.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomController } from './controllers/room/room.controller';
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
        MongooseModule.forFeature([{ name: History.name, schema: historySchema }]),
    ],
    controllers: [QuizzesController, AdminGuardController, RoomController, HistoryController],
    providers: [
        Logger,
        AdminGuardService,
        QuizzesService,
        RoomManagerService,
        HistoryService,
        GameGateway,
        ChatGateway,
        WaitingGateway,
        JoinGateway,
        TimeGateway,
    ],
})
export class AppModule {}
