"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const webhook_routes_1 = require("./routes/webhook.routes");
const error_middleware_1 = require("./middleware/error.middleware");
const logger_1 = require("./utils/logger");
const firebase_1 = require("./config/firebase");
// Load environment variables before any other initialization
dotenv_1.default.config();
// Debug environment variables
console.log('Environment variables loaded:');
console.log(`GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID ? 'Set' : 'Not set'}`);
console.log(`GCP_TYPE: ${process.env.GCP_TYPE ? 'Set' : 'Not set'}`);
console.log(`GCP_PRIVATE_KEY_ID: ${process.env.GCP_PRIVATE_KEY_ID ? 'Set' : 'Not set'}`);
console.log(`GCP_CLIENT_EMAIL: ${process.env.GCP_CLIENT_EMAIL ? 'Set' : 'Not set'}`);
const app = (0, express_1.default)();
const logger = (0, logger_1.setupLogger)();
// Initialize Firebase and handle initialization errors gracefully
try {
    (0, firebase_1.initializeFirebase)();
    logger.info('Firebase initialized successfully');
}
catch (error) {
    logger.error('Firebase initialization failed, but server will continue running:', error);
    // We'll continue running the server, but Firebase operations will fail
}
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
(0, webhook_routes_1.setupWebhookRoutes)(app);
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
app.use(error_middleware_1.errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`HRMS Data Ingestion Service running on port ${PORT}`);
});
