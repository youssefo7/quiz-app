"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEvents = void 0;
var ChatEvents;
(function (ChatEvents) {
    ChatEvents["Validate"] = "validate";
    ChatEvents["ValidateACK"] = "validateWithAck";
    ChatEvents["BroadcastAll"] = "broadcastAll";
    ChatEvents["JoinRoom"] = "joinRoom";
    ChatEvents["RoomMessage"] = "roomMessage";
    ChatEvents["WordValidated"] = "wordValidated";
    ChatEvents["MassMessage"] = "massMessage";
    ChatEvents["Hello"] = "hello";
    ChatEvents["Clock"] = "clock";
})(ChatEvents || (exports.ChatEvents = ChatEvents = {}));
//# sourceMappingURL=chat.gateway.events.js.map