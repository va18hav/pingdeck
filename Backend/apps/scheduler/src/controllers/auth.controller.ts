import { Request, Response } from 'express';
import { registerSchema, loginSchema } from '../types/validation.types.js';
import * as authService from '../services/auth.service.js';

export const register = async (req: Request, res: Response) => {
    const { email, password } = registerSchema.parse(req.body);

    const { user, token } = await authService.registerUser(email, password);

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
    });
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    const { user, token } = await authService.loginUser(email, password);

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: user
    });
};

export const logout = async (req: Request, res: Response) => {
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }

    const user = await authService.getUserById(req.userId);

    res.status(200).json({ success: true, data: user });
};
