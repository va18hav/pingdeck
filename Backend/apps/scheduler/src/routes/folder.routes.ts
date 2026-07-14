import { Router } from 'express';
import * as folderController from '../controllers/folder.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/project/:projectId', folderController.getProjectFolders);
router.post('/', folderController.createFolder);
router.put('/:id', folderController.updateFolder);
router.delete('/:id', folderController.deleteFolder);

export default router;
