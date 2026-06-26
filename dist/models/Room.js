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
exports.Room = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const roomSchema = new mongoose_1.Schema({
    roomCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        minlength: 6,
        maxlength: 6,
    },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    hostId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [
        {
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            username: String,
            avatarColor: String,
            joinedAt: { type: Date, default: Date.now },
            isOnline: { type: Boolean, default: true },
        },
    ],
    currentTrack: {
        type: {
            videoId: String,
            title: String,
            thumbnail: String,
            channelTitle: String,
            duration: Number,
            startedAt: Number,
            pausedAt: Number,
            isPlaying: { type: Boolean, default: false },
        },
        default: null,
    },
    queue: [
        {
            videoId: String,
            title: String,
            thumbnail: String,
            channelTitle: String,
            duration: Number,
            addedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            addedByUsername: String,
            votes: { type: Number, default: 0 },
            skipVotes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
        },
    ],
    history: [
        {
            videoId: String,
            title: String,
            thumbnail: String,
            channelTitle: String,
            playedAt: { type: Date, default: Date.now },
        },
    ],
    settings: {
        allowGuestQueue: { type: Boolean, default: true },
        allowGuestControl: { type: Boolean, default: false },
        voteToSkipThreshold: { type: Number, default: 0.5 },
        maxQueueSize: { type: Number, default: 50 },
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
roomSchema.index({ roomCode: 1 }, { unique: true });
roomSchema.index({ isActive: 1 });
exports.Room = mongoose_1.default.model('Room', roomSchema);
//# sourceMappingURL=Room.js.map