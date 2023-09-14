"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const course_1 = require("./model/database/course");
const course_controller_1 = require("./controllers/course/course.controller");
const course_service_1 = require("./services/course/course.service");
const date_controller_1 = require("./controllers/date/date.controller");
const date_service_1 = require("./services/date/date.service");
const chat_gateway_1 = require("./gateways/chat/chat.gateway");
const example_service_1 = require("./services/example/example.service");
const example_controller_1 = require("./controllers/example/example.controller");
let AppModule = exports.AppModule = class AppModule {
};
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    uri: config.get('DATABASE_CONNECTION_STRING'),
                }),
            }),
            mongoose_1.MongooseModule.forFeature([{ name: course_1.Course.name, schema: course_1.courseSchema }]),
        ],
        controllers: [course_controller_1.CourseController, date_controller_1.DateController, example_controller_1.ExampleController],
        providers: [chat_gateway_1.ChatGateway, course_service_1.CourseService, date_service_1.DateService, example_service_1.ExampleService, common_1.Logger],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map