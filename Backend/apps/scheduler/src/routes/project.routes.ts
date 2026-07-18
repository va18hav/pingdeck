import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { requireAuth, requireVerified } from '../middlewares/auth.middleware.js';

const router = Router();

router.use([requireAuth, requireVerified]);

router.post('/', projectController.createProject);
router.get('/', projectController.getUserProjects);
router.delete('/:id', projectController.deleteProject);
router.get('/:projectId/cookies', projectController.getProjectCookies);
router.delete('/:projectId/cookies', projectController.deleteProjectCookies);
router.get('/:projectId/last-opened', projectController.getLastOpenedEndpoint);
router.post('/:projectId/last-opened', projectController.setLastOpenedEndpoint);

export default router;
