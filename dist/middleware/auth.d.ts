import type { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    userId?: string;
    username?: string;
}
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function generateToken(userId: string, username: string): string;
//# sourceMappingURL=auth.d.ts.map