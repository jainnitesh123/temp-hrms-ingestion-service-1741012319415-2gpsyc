"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebhookRoutes = void 0;
const express_1 = require("express");
const validation_middleware_1 = require("../middleware/validation.middleware");
const webhook_controller_1 = require("../controllers/webhook.controller");
const setupWebhookRoutes = (app) => {
    const router = (0, express_1.Router)();
    const webhookController = new webhook_controller_1.WebhookController();
    // Bind the handleWebhook method to the controller instance
    const handleWebhook = webhookController.handleWebhook.bind(webhookController);
    // Webhook route with validation middleware
    router.post('/webhook/tartan', validation_middleware_1.validateWebhookRequest, handleWebhook);
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
exports.setupWebhookRoutes = setupWebhookRoutes;
