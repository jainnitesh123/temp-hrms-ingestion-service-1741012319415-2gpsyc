import { Router, Application } from 'express';
import { validateWebhookRequest } from '../middleware/validation.middleware';
import { WebhookController } from '../controllers/webhook.controller';

export const setupWebhookRoutes = (app: Application) => {
  const router = Router();
  const webhookController = new WebhookController();

  // Bind the handleWebhook method to the controller instance
  const handleWebhook = webhookController.handleWebhook.bind(webhookController);

  // Webhook route with validation middleware
  router.post(
    '/webhook/tartan',
    validateWebhookRequest,
    handleWebhook
  );

  // Direct API endpoint without validation for testing
  router.post('/webhook', handleWebhook);

  // GET endpoint for health check
  router.get('/webhook/health', (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Webhook service is running'
    });
  });

  app.use('/api/v1', router);
};