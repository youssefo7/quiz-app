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
exports.ChatGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chat_gateway_constants_1 = require("./chat.gateway.constants");
const chat_gateway_events_1 = require("./chat.gateway.events");
let ChatGateway = exports.ChatGateway = class ChatGateway {
    constructor(logger) {
        this.logger = logger;
        this.room = chat_gateway_constants_1.PRIVATE_ROOM_ID;
    }
    validate(socket, word) {
        socket.emit(chat_gateway_events_1.ChatEvents.WordValidated, (word === null || word === void 0 ? void 0 : word.length) > chat_gateway_constants_1.WORD_MIN_LENGTH);
    }
    validateWithAck(_, word) {
        return { isValid: (word === null || word === void 0 ? void 0 : word.length) > chat_gateway_constants_1.WORD_MIN_LENGTH };
    }
    broadcastAll(socket, message) {
        this.server.emit(chat_gateway_events_1.ChatEvents.MassMessage, `${socket.id} : ${message}`);
    }
    joinRoom(socket) {
        socket.join(this.room);
    }
    roomMessage(socket, message) {
        if (socket.rooms.has(this.room)) {
            this.server.to(this.room).emit(chat_gateway_events_1.ChatEvents.RoomMessage, `${socket.id} : ${message}`);
        }
    }
    afterInit() {
        setInterval(() => {
            this.emitTime();
        }, chat_gateway_constants_1.DELAY_BEFORE_EMITTING_TIME);
    }
    handleConnection(socket) {
        this.logger.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
        socket.emit(chat_gateway_events_1.ChatEvents.Hello, 'Hello World!');
    }
    handleDisconnect(socket) {
        this.logger.log(`Déconnexion par l'utilisateur avec id : ${socket.id}`);
    }
    emitTime() {
        this.server.emit(chat_gateway_events_1.ChatEvents.Clock, new Date().toLocaleTimeString());
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(chat_gateway_events_1.ChatEvents.Validate),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "validate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(chat_gateway_events_1.ChatEvents.ValidateACK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "validateWithAck", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(chat_gateway_events_1.ChatEvents.BroadcastAll),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "broadcastAll", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(chat_gateway_events_1.ChatEvents.JoinRoom),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "joinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(chat_gateway_events_1.ChatEvents.RoomMessage),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "roomMessage", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: true }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [common_1.Logger])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map