import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const guestLoginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(30, 'Username must be 30 characters or less')
    .trim(),
});

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, 'Room name is required')
    .max(50, 'Room name must be 50 characters or less')
    .trim(),
});

export const chatMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be 1000 characters or less'),
  mentions: z.array(z.string()).optional().default([]),
});

export const addTrackSchema = z.object({
  videoId: z.string().min(1),
  title: z.string().min(1),
  thumbnail: z.string().url().or(z.string().min(1)),
  channelTitle: z.string().min(1),
  duration: z.number().positive(),
});

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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
