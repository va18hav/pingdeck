import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Resend } from 'resend';
import { logger } from 'shared';
import * as authRepo from '../repositories/auth.repository.js';
import { AppError } from '../lib/appError.js';
import { redis } from '../lib/redis.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-123';

export const registerUser = async (email: string, passwordPlain: string) => {
    const existingUser = await authRepo.findUserByEmail(email);
    if (existingUser) {
        throw new AppError(400, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    const user = await authRepo.createUser(email, hashedPassword);

    const token = jwt.sign({ userId: user.id, isVerified: user.isVerified }, JWT_SECRET, { expiresIn: '1d' });

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

    const token = jwt.sign({ userId: user.id, isVerified: user.isVerified }, JWT_SECRET, { expiresIn: '1d' });

    return { user: { id: user.id, email: user.email, isVerified: user.isVerified }, token };
};

export const getUserById = async (id: string) => {
    const user = await authRepo.findUserById(id);
    if (!user) {
        throw new AppError(404, 'User not found');
    }
    return user;
};

export const sendOtp = async (userId: string) => {
    const user = await authRepo.findUserById(userId);
    if (!user) {
        throw new AppError(404, 'User not found');
    }

    // Rate limiting: max 5 requests per 10 minutes (600 seconds)
    const limitKey = `otp-limit:${userId}`;
    const requests = await redis.incr(limitKey);
    const ttl = await redis.ttl(limitKey);
    if (ttl === -1) {
        await redis.expire(limitKey, 600);
    }
    if (requests > 5) {
        throw new AppError(429, 'Too many OTP requests. Please wait up to 10 minutes before requesting another OTP.');
    }

    // Generate 4-digit OTP code (e.g. "4829")
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store in Redis with 5 minutes (300 seconds) TTL
    await redis.set(`otp:${userId}`, otp, 'EX', 300);

    // Send email using Resend
    if (!process.env.RESEND_API_KEY) {
        // Fallback safety for development context if API key isn't provided
        logger.warn(`RESEND_API_KEY is not set. Verification OTP: ${otp}`);
        throw new AppError(500, 'Email service is not configured (RESEND_API_KEY missing)');
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'PingLoop <onboarding@resend.dev>',
            to: user.email,
            subject: 'Verify your PingLoop email address',
            html: `
                <div style="font-family: sans-serif; padding: 24px; max-width: 600px; color: #334155;">
                    <h2 style="color: #2563eb;">Verify your email</h2>
                    <p>Thank you for using PingLoop! Please verify your email address by entering the following 4-digit code:</p>
                    <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 24px 0;">
                        ${otp}
                    </div>
                    <p style="font-size: 14px; color: #64748b;">This verification code is valid for 5 minutes. If you did not request this code, you can safely ignore this email.</p>
                </div>
            `
        });
        logger.info(`Verification OTP sent successfully to ${user.email}`);
    } catch (err: any) {
        logger.error({ err }, `Resend email dispatch failed for user ${userId}`);
        throw new AppError(500, `Failed to send email: ${err.message || 'Unknown error'}`);
    }
};

export const verifyOtp = async (userId: string, code: string, purpose?: string) => {
    const storedOtp = await redis.get(`otp:${userId}`);
    if (!storedOtp) {
        throw new AppError(400, 'Verification code expired. Please request a new one.');
    }
    if (storedOtp !== code) {
        throw new AppError(400, 'Invalid verification code');
    }

    // Delete OTP from Redis immediately on success
    await redis.del(`otp:${userId}`);

    if (purpose === 'update-password') {
        // Authorize password update
        await redis.set(`password-reset-authorized:${userId}`, 'true', 'EX', 300); // 5 minutes TTL
        const user = await authRepo.findUserById(userId);
        if (!user) throw new AppError(404, 'User not found');
        return user;
    } else {
        // Default: Update verified status in DB
        const updatedUser = await authRepo.verifyUser(userId);
        return updatedUser;
    }
};

export const loginOrRegisterGoogle = async (credential?: string, code?: string, redirectUri?: string) => {
    let payload;

    if (code) {
        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        try {
            const { tokens } = await client.getToken({
                code,
                redirect_uri: redirectUri
            });
            const ticket = await client.verifyIdToken({
                idToken: tokens.id_token!,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (err: any) {
            logger.error({ err }, 'Google Auth Code exchange failed');
            throw new AppError(400, 'Invalid Google authentication code');
        }
    } else if (credential) {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        try {
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (err: any) {
            logger.error({ err }, 'Google ID token verification failed');
            throw new AppError(400, 'Invalid Google authentication token');
        }
    } else {
        throw new AppError(400, 'Missing Google credential or code');
    }

    if (!payload || !payload.email) {
        throw new AppError(400, 'Failed to extract email from Google identity');
    }

    const email = payload.email.toLowerCase();

    // Check if user already exists
    const existingUser = await authRepo.findUserByEmail(email);
    let userResult;

    if (existingUser) {
        if (!existingUser.isVerified) {
            userResult = await authRepo.verifyUser(existingUser.id);
        } else {
            userResult = {
                id: existingUser.id,
                email: existingUser.email,
                isVerified: existingUser.isVerified,
                createdAt: existingUser.createdAt
            };
        }
    } else {
        // Create new user with a secure random password
        const secureRandomPassword = crypto.randomBytes(32).toString('hex');
        const passwordHash = await bcrypt.hash(secureRandomPassword, 10);
        const newUser = await authRepo.createUser(email, passwordHash);

        // Mark as verified immediately
        userResult = await authRepo.verifyUser(newUser.id);
    }

    const token = jwt.sign({ userId: userResult.id, isVerified: userResult.isVerified }, JWT_SECRET, { expiresIn: '1d' });

    return { user: userResult, token };
};

export const loginOrRegisterGithub = async (code: string) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new AppError(500, 'GitHub OAuth application is not configured on the server');
    }

    // 1. Exchange authorization code for GitHub access token
    let accessToken: string;
    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error(`Token exchange failed with status ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json() as any;
        if (tokenData.error) {
            throw new Error(`GitHub token error: ${tokenData.error_description || tokenData.error}`);
        }

        accessToken = tokenData.access_token;
    } catch (err: any) {
        logger.error({ err }, 'GitHub OAuth access token exchange failed');
        throw new AppError(400, `GitHub token exchange failed: ${err.message}`);
    }

    // 2. Fetch user profile from GitHub
    let githubUser: any;
    try {
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'PingDeck-App',
            },
        });

        if (!userResponse.ok) {
            throw new Error(`Failed to fetch user profile: status ${userResponse.status}`);
        }

        githubUser = await userResponse.json();
    } catch (err: any) {
        logger.error({ err }, 'Failed to fetch user details from GitHub');
        throw new AppError(400, 'Failed to retrieve GitHub user details');
    }

    // 3. Fetch user emails to get the primary/verified email
    let email: string | null = null;
    try {
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'PingDeck-App',
            },
        });

        if (emailsResponse.ok) {
            const emails = await emailsResponse.json() as any[];
            const primaryEmailObj = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified) || emails[0];
            if (primaryEmailObj) {
                email = primaryEmailObj.email;
            }
        }
    } catch (err) {
        logger.warn({ err }, 'Failed to fetch user emails from GitHub, falling back to profile email');
    }

    // Fallback to profile email
    if (!email && githubUser.email) {
        email = githubUser.email;
    }

    if (!email) {
        throw new AppError(400, 'Could not retrieve a valid email address from your GitHub account.');
    }

    email = email.toLowerCase();

    // Check if user already exists
    const existingUser = await authRepo.findUserByEmail(email);
    let userResult;

    if (existingUser) {
        if (!existingUser.isVerified) {
            userResult = await authRepo.verifyUser(existingUser.id);
        } else {
            userResult = {
                id: existingUser.id,
                email: existingUser.email,
                isVerified: existingUser.isVerified,
                createdAt: existingUser.createdAt
            };
        }
    } else {
        // Create new user with a secure random password
        const secureRandomPassword = crypto.randomBytes(32).toString('hex');
        const passwordHash = await bcrypt.hash(secureRandomPassword, 10);
        const newUser = await authRepo.createUser(email, passwordHash);

        // Mark as verified immediately
        userResult = await authRepo.verifyUser(newUser.id);
    }

    const token = jwt.sign({ userId: userResult.id, isVerified: userResult.isVerified }, JWT_SECRET, { expiresIn: '1d' });

    return { user: userResult, token };
};

export const forgotPassword = async (email: string) => {
    const user = await authRepo.findUserByEmail(email.toLowerCase());
    if (!user) {
        throw new AppError(404, 'No account found with this email address');
    }

    // Rate limit: max 5 OTP requests per 10 minutes per email
    const limitKey = `otp-limit-reset:${email}`;
    const requests = await redis.incr(limitKey);
    const ttl = await redis.ttl(limitKey);
    if (ttl === -1) {
        await redis.expire(limitKey, 600);
    }
    if (requests > 5) {
        throw new AppError(429, 'Too many password reset requests. Please try again in 10 minutes.');
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store reset OTP in Redis with 5 minutes (300s) TTL
    await redis.set(`otp-reset:${email}`, otp, 'EX', 300);

    if (!process.env.RESEND_API_KEY) {
        logger.warn(`RESEND_API_KEY is not set. Forgot Password OTP: ${otp}`);
        throw new AppError(500, 'Email service is not configured (RESEND_API_KEY missing)');
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'PingDeck <onboarding@resend.dev>',
            to: user.email,
            subject: 'Reset your PingDeck password',
            html: `
                <div style="font-family: sans-serif; padding: 24px; max-width: 600px; color: #334155;">
                    <h2 style="color: #2563eb;">Reset your password</h2>
                    <p>You requested a password reset for your PingDeck account. Please verify your identity by entering the following 4-digit code:</p>
                    <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 24px 0;">
                        ${otp}
                    </div>
                    <p style="font-size: 14px; color: #64748b;">This verification code is valid for 5 minutes. If you did not request a password reset, you can safely ignore this email.</p>
                </div>
            `
        });
        logger.info(`Forgot password OTP sent successfully to ${user.email}`);
    } catch (err: any) {
        logger.error({ err }, `Resend email dispatch failed for forgot password user ${user.id}`);
        throw new AppError(500, `Failed to send email: ${err.message || 'Unknown error'}`);
    }
};

export const verifyResetOtp = async (email: string, code: string) => {
    const storedOtp = await redis.get(`otp-reset:${email}`);
    if (!storedOtp) {
        throw new AppError(400, 'Reset code expired. Please request a new one.');
    }
    if (storedOtp !== code) {
        throw new AppError(400, 'Invalid reset code');
    }

    await redis.del(`otp-reset:${email}`);

    // Authorize reset
    await redis.set(`password-reset-authorized:${email}`, 'true', 'EX', 300); // 5 minutes TTL
};

export const resetPassword = async (email: string, passwordPlain: string) => {
    const isAuthorized = await redis.get(`password-reset-authorized:${email}`);
    if (isAuthorized !== 'true') {
        throw new AppError(403, 'Unauthorized. Please verify your identity via email code first.');
    }

    const user = await authRepo.findUserByEmail(email.toLowerCase());
    if (!user) {
        throw new AppError(404, 'User not found');
    }

    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    await authRepo.updatePassword(user.id, hashedPassword);

    await redis.del(`password-reset-authorized:${email}`);
};

export const updatePassword = async (userId: string, passwordPlain: string) => {
    const isAuthorized = await redis.get(`password-reset-authorized:${userId}`);
    if (isAuthorized !== 'true') {
        throw new AppError(403, 'Unauthorized. Please verify your identity via email code first.');
    }

    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    await authRepo.updatePassword(userId, hashedPassword);

    await redis.del(`password-reset-authorized:${userId}`);
};
