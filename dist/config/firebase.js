"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.validateRemark = exports.validateOrganization = exports.validateEmployee = exports.COLLECTIONS = exports.initializeFirebase = void 0;
const admin = __importStar(require("firebase-admin"));
const logger_1 = require("../utils/logger");
const initializeFirebase = () => {
    try {
        // Debug environment variables
        console.log('Initializing Firebase with:');
        console.log(`GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID}`);
        // Check for required environment variables
        if (!process.env.GCP_PROJECT_ID) {
            throw new Error('GCP_PROJECT_ID environment variable is not set. Please check your .env file.');
        }
        // Check for required service account fields
        const requiredFields = [
            'GCP_TYPE',
            'GCP_PROJECT_ID',
            'GCP_PRIVATE_KEY_ID',
            'GCP_PRIVATE_KEY',
            'GCP_CLIENT_EMAIL'
        ];
        for (const field of requiredFields) {
            if (!process.env[field]) {
                throw new Error(`${field} environment variable is not set. Please check your .env file.`);
            }
        }
        // Construct the service account object from individual environment variables
        const serviceAccount = {
            type: process.env.GCP_TYPE,
            project_id: process.env.GCP_PROJECT_ID,
            private_key_id: process.env.GCP_PRIVATE_KEY_ID,
            private_key: process.env.GCP_PRIVATE_KEY,
            client_email: process.env.GCP_CLIENT_EMAIL,
            client_id: process.env.GCP_CLIENT_ID,
            auth_uri: process.env.GCP_AUTH_URI,
            token_uri: process.env.GCP_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.GCP_AUTH_PROVIDER_CERT_URL,
            client_x509_cert_url: process.env.GCP_CLIENT_CERT_URL,
            universe_domain: process.env.GCP_UNIVERSE_DOMAIN
        };
        // Check if Firebase is already initialized
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.GCP_PROJECT_ID
            });
            logger_1.logger.info('Firebase Admin SDK initialized successfully');
        }
        return admin.firestore();
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during Firebase initialization';
        logger_1.logger.error('Failed to initialize Firebase:', { error: errorMessage });
        throw error; // Re-throw to be handled by the calling code
    }
};
exports.initializeFirebase = initializeFirebase;
// Collection names as constants to prevent typos
exports.COLLECTIONS = {
    SYNC_EVENTS: 'sync_events',
    EMPLOYEES: 'employees',
    ORGANIZATIONS: 'organizations',
    REMARKS: 'remarks'
};
// Schema validation functions
const validateEmployee = (data) => {
    const required = [
        'name',
        'email',
        'id',
        'employeeId',
        'orgId'
    ];
    for (const field of required) {
        if (!data[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    return true;
};
exports.validateEmployee = validateEmployee;
const validateOrganization = (data) => {
    const required = [
        'orgId',
        'orgName',
        'status'
    ];
    for (const field of required) {
        if (!data[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    return true;
};
exports.validateOrganization = validateOrganization;
const validateRemark = (data) => {
    const required = [
        'remark',
        'persona',
        'editedBy',
        'id'
    ];
    for (const field of required) {
        if (!data[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    return true;
};
exports.validateRemark = validateRemark;
// Initialize Firestore with better error handling
let db = null;
exports.db = db;
try {
    exports.db = db = (0, exports.initializeFirebase)();
    logger_1.logger.info('Firestore initialized successfully');
}
catch (error) {
    logger_1.logger.error('Failed to initialize Firestore:', error);
    // Don't throw here, let the application continue but log the error
}
// Create indexes for frequently queried fields
const createIndexes = async () => {
    if (!db) {
        logger_1.logger.error('Cannot create indexes: Firestore not initialized');
        return;
    }
    try {
        // Create collections and indexes
        const collections = Object.values(exports.COLLECTIONS);
        for (const collection of collections) {
            const collectionRef = db.collection(collection);
            await collectionRef.doc('_dummy').set({
                _dummy: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            await collectionRef.doc('_dummy').delete();
        }
        logger_1.logger.info('Firestore indexes created successfully');
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error creating indexes';
        logger_1.logger.error('Error creating Firestore indexes:', { error: errorMessage });
    }
};
// Call createIndexes when the app starts
if (db) {
    createIndexes().catch(error => {
        logger_1.logger.error('Failed to create indexes:', error);
    });
}
