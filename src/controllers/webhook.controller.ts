import { Request, Response, NextFunction } from 'express';
import { WebhookService } from '../services/webhook.service';
import { WebhookEvent } from '../types/webhook.types';
import { logger } from '../utils/logger';

export class WebhookController {
  private webhookService: WebhookService;

  constructor() {
    this.webhookService = new WebhookService();
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const webhookEvent = req.body as WebhookEvent;
      
      logger.info('Received webhook event', {
        event: webhookEvent.event,
        orgId: webhookEvent.orgId,
        requestId: webhookEvent.requestId
      });

      if (webhookEvent.event.startsWith('sync.events')) {
        await this.webhookService.handleSyncEvent(webhookEvent);
      } else if (webhookEvent.event.startsWith('connection.events')) {
        await this.webhookService.handleConnectionEvent(webhookEvent);
      } else if (webhookEvent.event === 'record.employee.remark') {
        await this.webhookService.handleRemarkEvent(webhookEvent);
      } else {
        logger.warn('Unknown event type received', { event: webhookEvent.event });
      }

      res.status(200).json({
        status: 'success',
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      logger.error('Error processing webhook:', error);
      next(error);
    }
  }
}