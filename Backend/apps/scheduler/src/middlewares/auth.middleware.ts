import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-123';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    
    if (!token) {
        res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
};
