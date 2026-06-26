import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
export declare const guestLoginSchema: z.ZodObject<{
    username: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
}, {
    username: string;
}>;
export declare const createRoomSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const chatMessageSchema: z.ZodObject<{
    content: z.ZodString;
    mentions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    mentions: string[];
}, {
    content: string;
    mentions?: string[] | undefined;
}>;
export declare const addTrackSchema: z.ZodObject<{
    videoId: z.ZodString;
    title: z.ZodString;
    thumbnail: z.ZodUnion<[z.ZodString, z.ZodString]>;
    channelTitle: z.ZodString;
    duration: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    videoId: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    duration: number;
}, {
    videoId: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    duration: number;
}>;
export declare function validate(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map