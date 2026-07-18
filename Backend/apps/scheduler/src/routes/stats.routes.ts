import { Router } from 'express';
import * as statsController from '../controllers/stats.controller.js';
import { requireAuth, requireVerified } from '../middlewares/auth.middleware.js';

const router = Router();

router.use([requireAuth, requireVerified]);

router.get('/', statsController.getMonitorStats);

export default router;
