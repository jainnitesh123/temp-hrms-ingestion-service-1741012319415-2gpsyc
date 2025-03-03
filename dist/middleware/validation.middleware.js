"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWebhookRequest = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
const validateWebhookRequest = (req, res, next) => {
    try {
        const signature = req.headers['tartan-signature'];
        const webhookSecret = process.env.WEBHOOK_SECRET;
        if (!signature || !webhookSecret) {
            logger_1.logger.error('Missing signature or webhook secret', {
                hasSignature: !!signature,
                hasWebhookSecret: !!webhookSecret
            });
            return res.status(401).json({
                status: 'error',
                message: 'Invalid request signature'
            });
        }
        const payload = JSON.stringify(req.body);
        const hmac = crypto_1.default
            .createHmac('sha256', webhookSecret)
            .update(payload)
            .digest('hex');
        if (signature !== hmac) {
            logger_1.logger.error('Invalid webhook signature', {
                expectedSignature: hmac,
                receivedSignature: signature
            });
            return res.status(401).json({
                status: 'error',
                message: 'Invalid request signature'
            });
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Webhook validation error:', error);
        next(error);
    }
};
exports.validateWebhookRequest = validateWebhookRequest;
