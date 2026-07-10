import { Router } from 'express';
import * as endpointController from '../controllers/endpoint.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', endpointController.createEndpoint);
router.get('/project/:projectId', endpointController.getProjectEndpoints);
router.delete('/:id', endpointController.deleteEndpoint);
router.get('/:id', endpointController.getEndpointDetails);
router.get('/:id/responses', endpointController.getEndpointResponses);

export default router;
