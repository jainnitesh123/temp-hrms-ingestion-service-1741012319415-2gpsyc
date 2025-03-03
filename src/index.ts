import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { setupWebhookRoutes } from './routes/webhook.routes';
import { errorHandler } from './middleware/error.middleware';
import { setupLogger } from './utils/logger';
import { initializeFirebase } from './config/firebase';

// Load environment variables before any other initialization
dotenv.config();

// Debug environment variables
console.log('Environment variables loaded:');
console.log(`GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID ? 'Set' : 'Not set'}`);
console.log(`GCP_TYPE: ${process.env.GCP_TYPE ? 'Set' : 'Not set'}`);
console.log(`GCP_PRIVATE_KEY_ID: ${process.env.GCP_PRIVATE_KEY_ID ? 'Set' : 'Not set'}`);
console.log(`GCP_CLIENT_EMAIL: ${process.env.GCP_CLIENT_EMAIL ? 'Set' : 'Not set'}`);

const app = express();
const logger = setupLogger();

// Initialize Firebase and handle initialization errors gracefully
try {
  initializeFirebase();
  logger.info('Firebase initialized successfully');
} catch (error) {
  logger.error('Firebase initialization failed, but server will continue running:', error);
  // We'll continue running the server, but Firebase operations will fail
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  });
  next();
});

// Routes
setupWebhookRoutes(app);

// Add a root route for API documentation
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'HRMS Data Ingestion Service',
    version: '1.0.0',
    endpoints: {
      '/api/v1/webhook/tartan': 'POST - Webhook endpoint with signature validation',
      '/api/v1/webhook': 'POST - Direct webhook endpoint for testing',
      '/api/v1/webhook/health': 'GET - Health check endpoint'
    }
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`HRMS Data Ingestion Service running on port ${PORT}`);
});