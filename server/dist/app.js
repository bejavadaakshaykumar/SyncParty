"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_js_1 = require("./config/env.js");
const rateLimiter_js_1 = require("./middleware/rateLimiter.js");
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const rooms_js_1 = __importDefault(require("./routes/rooms.js"));
const youtube_js_1 = __importDefault(require("./routes/youtube.js"));
const playlists_js_1 = __importDefault(require("./routes/playlists.js"));
const app = (0, express_1.default)();
// Security
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)({ origin: env_js_1.env.CORS_ORIGIN, credentials: true }));
app.use(express_1.default.json({ limit: '1mb' }));
// Rate limiting
app.use('/api/', rateLimiter_js_1.apiLimiter);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/auth', auth_js_1.default);
app.use('/api/rooms', rooms_js_1.default);
app.use('/api/youtube', youtube_js_1.default);
app.use('/api/playlists', playlists_js_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Error handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
exports.default = app;
//# sourceMappingURL=app.js.map