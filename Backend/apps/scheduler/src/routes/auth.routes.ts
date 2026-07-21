import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.post('/send-otp', requireAuth, authController.sendOtp);
router.post('/verify-otp', requireAuth, authController.verifyOtp);
router.post('/google', authController.googleLogin);
router.post('/github', authController.githubLogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);
router.post('/update-password', requireAuth, authController.updatePassword);

export default router;
