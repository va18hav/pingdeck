import { Router } from 'express';
import * as endpointController from '../controllers/endpoint.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { testPingLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.use(requireAuth);

router.post('/', endpointController.createEndpoint);
router.get('/project/:projectId', endpointController.getProjectEndpoints);
router.delete('/:id', endpointController.deleteEndpoint);
router.put('/:id', endpointController.updateEndpoint);
router.get('/:id', endpointController.getEndpointDetails);
router.post('/:id/test', testPingLimiter, endpointController.testEndpoint);
router.get('/:id/responses', endpointController.getEndpointResponses);

export default router;
