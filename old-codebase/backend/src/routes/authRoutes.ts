
import { Router } from 'express';
import { login, register, requestSignupCode, forgotPassword, resetPassword } from '../controllers/authController';
import { cloudinaryUpload } from '../config/cloudinary';

const router = Router();

router.post('/login', login);
router.post('/register', cloudinaryUpload.fields([
    { name: 'competencyCertificate', maxCount: 1 },
    { name: 'tradeLicense', maxCount: 1 }
]), register);
router.post('/request-code', requestSignupCode);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
