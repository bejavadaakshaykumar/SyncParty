"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.generateToken = generateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}
function generateToken(userId, username) {
    return jsonwebtoken_1.default.sign({ userId, username }, env_js_1.env.JWT_SECRET, { expiresIn: '7d' });
}
//# sourceMappingURL=auth.js.map