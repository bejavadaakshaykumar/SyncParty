"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const userSchema = new mongoose_1.Schema({
    username: { type: String, required: true, trim: true, minlength: 1, maxlength: 30 },
    avatarUrl: { type: String, default: '' },
    avatarColor: {
        type: String,
        default: () => {
            const colors = [
                '#8B5CF6', '#06B6D4', '#EC4899', '#F59E0B',
                '#10B981', '#6366F1', '#EF4444', '#3B82F6',
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        },
    },
    isGuest: { type: Boolean, default: true },
    googleId: { type: String, sparse: true },
    email: { type: String, sparse: true },
    favorites: [{ type: String }],
    recentlyPlayed: [
        {
            videoId: String,
            title: String,
            thumbnail: String,
            playedAt: { type: Date, default: Date.now },
        },
    ],
    lastActiveAt: { type: Date, default: Date.now },
}, { timestamps: true });
userSchema.index({ googleId: 1 }, { sparse: true });
exports.User = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.js.map