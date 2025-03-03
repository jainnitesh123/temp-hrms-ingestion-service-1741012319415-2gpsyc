"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const webhook_service_1 = require("../services/webhook.service");
const logger_1 = require("../utils/logger");
class WebhookController {
    webhookService;
    constructor() {
        this.webhookService = new webhook_service_1.WebhookService();
    }
    async handleWebhook(req, res, next) {
        try {
            const webhookEvent = req.body;
            logger_1.logger.info('Received webhook event', {
                event: webhookEvent.event,
                orgId: webhookEvent.orgId,
                requestId: webhookEvent.requestId
            });
            if (webhookEvent.event.startsWith('sync.events')) {
                await this.webhookService.handleSyncEvent(webhookEvent);
            }
            else if (webhookEvent.event.startsWith('connection.events')) {
                await this.webhookService.handleConnectionEvent(webhookEvent);
            }
            else if (webhookEvent.event === 'record.employee.remark') {
                await this.webhookService.handleRemarkEvent(webhookEvent);
            }
            else {
                logger_1.logger.warn('Unknown event type received', { event: webhookEvent.event });
            }
            res.status(200).json({
                status: 'success',
                message: 'Webhook processed successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Error processing webhook:', error);
            next(error);
        }
    }
}
exports.WebhookController = WebhookController;
