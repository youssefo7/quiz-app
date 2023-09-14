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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateController = void 0;
const common_1 = require("@nestjs/common");
const date_service_1 = require("../../services/date/date.service");
const swagger_1 = require("@nestjs/swagger");
const message_schema_1 = require("../../model/schema/message.schema");
let DateController = exports.DateController = class DateController {
    constructor(dateService) {
        this.dateService = dateService;
    }
    dateInfo() {
        return {
            title: 'Time',
            body: this.dateService.currentTime(),
        };
    }
};
__decorate([
    (0, common_1.Get)('/'),
    (0, swagger_1.ApiOkResponse)({
        description: 'Return current time',
        type: message_schema_1.Message,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", message_schema_1.Message)
], DateController.prototype, "dateInfo", null);
exports.DateController = DateController = __decorate([
    (0, common_1.Controller)('date'),
    __metadata("design:paramtypes", [date_service_1.DateService])
], DateController);
//# sourceMappingURL=date.controller.js.map