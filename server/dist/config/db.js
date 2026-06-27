"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_js_1 = require("./env.js");
const mongodb_memory_server_1 = require("mongodb-memory-server");
async function connectDB() {
    try {
        // Try standard connection first with a short timeout
        await mongoose_1.default.connect(env_js_1.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
        console.log('✅ MongoDB connected successfully');
    }
    catch (error) {
        console.log('⚠️  Standard MongoDB connection failed. Starting in-memory fallback...');
        try {
            const mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
            const uri = mongoServer.getUri();
            await mongoose_1.default.connect(uri);
            console.log('✅ In-Memory MongoDB connected successfully (Data will reset on restart)');
        }
        catch (memError) {
            console.error('❌ Failed to start in-memory database:', memError);
            process.exit(1);
        }
    }
}
exports.default = mongoose_1.default;
//# sourceMappingURL=db.js.map