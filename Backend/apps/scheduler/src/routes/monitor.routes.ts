import { Router } from 'express';
import * as monitorController from '../controllers/monitor.controller.js';
import { requireAuth, requireVerified } from '../middlewares/auth.middleware.js';

const router = Router();

router.use([requireAuth, requireVerified]);

router.post('/', monitorController.createMonitor);
router.delete('/:id', monitorController.deleteMonitor);
router.get('/:id/auth-status', monitorController.getMonitorAuthStatus);
router.post('/:id/sync-session', monitorController.syncMonitorSession);
router.patch('/:id', monitorController.updateMonitor);

export default router;
