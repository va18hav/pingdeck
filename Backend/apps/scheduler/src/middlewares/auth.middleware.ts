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
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; isVerified: boolean };
        req.userId = decoded.userId;
        req.isVerified = decoded.isVerified;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
};

export const requireVerified = (req: Request, res: Response, next: NextFunction) => {
    // If user is authenticated, check if their email is verified.
    if (req.isVerified === false) {
        res.status(403).json({ success: false, message: 'Email is not verified' });
        return;
    }
    next();
};
