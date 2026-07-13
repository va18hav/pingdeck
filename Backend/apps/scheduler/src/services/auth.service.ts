import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as authRepo from '../repositories/auth.repository.js';
import { AppError } from '../lib/appError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-123';

export const registerUser = async (email: string, passwordPlain: string) => {
    const existingUser = await authRepo.findUserByEmail(email);
    if (existingUser) {
        throw new AppError(400, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    const user = await authRepo.createUser(email, hashedPassword);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

    return { user, token };
};

export const loginUser = async (email: string, passwordPlain: string) => {
    const user = await authRepo.findUserByEmail(email);
    if (!user) {
        throw new AppError(400, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(passwordPlain, user.password);
    if (!isValidPassword) {
        throw new AppError(400, 'Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

    return { user: { id: user.id, email: user.email }, token };
};

export const getUserById = async (id: string) => {
    const user = await authRepo.findUserById(id);
    if (!user) {
        throw new AppError(404, 'User not found');
    }
    return user;
};
