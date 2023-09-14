"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleController = void 0;
const message_schema_1 = require("../../model/schema/message.schema");
const example_service_1 = require("../../services/example/example.service");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let ExampleController = exports.ExampleController = class ExampleController {
    constructor(exampleService) {
        this.exampleService = exampleService;
    }
    exampleInfo() {
        return this.exampleService.helloWorld();
    }
    about() {
        return this.exampleService.about();
    }
    send(requestBody) {
        this.exampleService.storeMessage(requestBody);
    }
    all() {
        return this.exampleService.getAllMessages();
    }
};
__decorate([
    (0, common_1.Get)('/'),
    (0, swagger_1.ApiOkResponse)({
        description: 'Return current time with hello world',
        type: message_schema_1.Message,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ExampleController.prototype, "exampleInfo", null);
__decorate([
    (0, swagger_1.ApiOkResponse)({
        description: 'Return information about http api',
        type: message_schema_1.Message,
    }),
    (0, common_1.Get)('/about'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ExampleController.prototype, "about", null);
__decorate([
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Send a message',
    }),
    (0, common_1.Post)('/send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [message_schema_1.Message]),
    __metadata("design:returntype", void 0)
], ExampleController.prototype, "send", null);
__decorate([
    (0, swagger_1.ApiOkResponse)({
        description: 'Return all messages',
        type: message_schema_1.Message,
        isArray: true,
    }),
    (0, common_1.Get)('/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ExampleController.prototype, "all", null);
exports.ExampleController = ExampleController = __decorate([
    (0, swagger_1.ApiTags)('Example'),
    (0, common_1.Controller)('example'),
    __metadata("design:paramtypes", [example_service_1.ExampleService])
], ExampleController);
//# sourceMappingURL=example.controller.js.map