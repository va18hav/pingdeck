import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', projectController.createProject);
router.get('/', projectController.getUserProjects);
router.delete('/:id', projectController.deleteProject);

export default router;
