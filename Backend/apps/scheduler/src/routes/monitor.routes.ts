import { Router } from 'express';
import * as monitorController from '../controllers/monitor.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', monitorController.createMonitor);
router.delete('/:id', monitorController.deleteMonitor);

export default router;
