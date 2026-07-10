import { Request, Response } from 'express';
import { prisma } from 'db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-123';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' });
            return;
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'User already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            },
            select: {
                id: true,
                email: true,
                createdAt: true
            }
        });

        res.status(201).json({ success: true, message: 'User registered successfully', data: user });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ success: false, message: msg });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            res.status(400).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            data: { id: user.id, email: user.email }
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ success: false, message: msg });
    }
};

export const logout = async (req: Request, res: Response) => {
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, email: true, createdAt: true }
        });
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ success: false, message: msg });
    }
};
