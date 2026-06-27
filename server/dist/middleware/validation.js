"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTrackSchema = exports.chatMessageSchema = exports.createRoomSchema = exports.guestLoginSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
exports.guestLoginSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(1, 'Username is required')
        .max(30, 'Username must be 30 characters or less')
        .trim(),
});
exports.createRoomSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'Room name is required')
        .max(50, 'Room name must be 50 characters or less')
        .trim(),
});
exports.chatMessageSchema = zod_1.z.object({
    content: zod_1.z
        .string()
        .min(1, 'Message cannot be empty')
        .max(1000, 'Message must be 1000 characters or less'),
    mentions: zod_1.z.array(zod_1.z.string()).optional().default([]),
});
exports.addTrackSchema = zod_1.z.object({
    videoId: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    thumbnail: zod_1.z.string().url().or(zod_1.z.string().min(1)),
    channelTitle: zod_1.z.string().min(1),
    duration: zod_1.z.number().positive(),
});
function validate(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}
//# sourceMappingURL=validation.js.map