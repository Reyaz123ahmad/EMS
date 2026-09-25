import { Router } from 'express';
import authController from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authRateLimit, otpRateLimit } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

// Public routes
router.post('/login', authRateLimit, authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', otpRateLimit, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-otp', authController.verifyOTP);
router.post('/send-otp', otpRateLimit, authController.sendOTP);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, authController.changePassword);

export default router;
