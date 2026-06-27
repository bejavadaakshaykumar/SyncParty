"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomCode = createRoomCode;
const nanoid_1 = require("nanoid");
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateCode = (0, nanoid_1.customAlphabet)(alphabet, 6);
function createRoomCode() {
    return generateCode();
}
//# sourceMappingURL=roomCode.js.map