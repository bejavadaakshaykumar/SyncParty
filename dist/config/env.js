"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const rawPort = process.env.PORT?.trim();
const parsedPort = parseInt(rawPort || '10000', 10);
exports.env = {
    PORT: isNaN(parsedPort) ? 10000 : parsedPort,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/syncparty',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
    CORS_ORIGIN: (process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'https://togetherwelisten.netlify.app').split(',').map(o => o.trim().replace(/\/$/, '')),
};
//# sourceMappingURL=env.js.map