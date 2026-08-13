import { Router } from 'express';
import { register, login, getProfile, googleLogin, getAuthConfig } from '../controllers/authController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.get('/config', getAuthConfig);
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', authenticateJWT, getProfile);

export default router;
