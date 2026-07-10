import { Router } from 'express';
import * as statsController from '../controllers/stats.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', statsController.getMonitorStats);

export default router;
