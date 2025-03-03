import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export const validateWebhookRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers['tartan-signature'];
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      logger.error('Missing signature or webhook secret', {
        hasSignature: !!signature,
        hasWebhookSecret: !!webhookSecret
      });
      return res.status(401).json({
        status: 'error',
        message: 'Invalid request signature'
      });
    }

    const payload = JSON.stringify(req.body);
    const hmac = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    if (signature !== hmac) {
      logger.error('Invalid webhook signature', {
        expectedSignature: hmac,
        receivedSignature: signature
      });
      return res.status(401).json({
        status: 'error',
        message: 'Invalid request signature'
      });
    }

    next();
  } catch (error) {
    logger.error('Webhook validation error:', error);
    next(error);
  }
};