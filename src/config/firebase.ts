import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';

export const initializeFirebase = () => {
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
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: process.env.GCP_PROJECT_ID
      });
      logger.info('Firebase Admin SDK initialized successfully');
    }

    return admin.firestore();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during Firebase initialization';
    logger.error('Failed to initialize Firebase:', { error: errorMessage });
    throw error; // Re-throw to be handled by the calling code
  }
};

// Collection names as constants to prevent typos
export const COLLECTIONS = {
  SYNC_EVENTS: 'sync_events',
  EMPLOYEES: 'employees',
  ORGANIZATIONS: 'organizations',
  REMARKS: 'remarks'
} as const;

// Schema validation functions
export const validateEmployee = (data: any) => {
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

export const validateOrganization = (data: any) => {
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

export const validateRemark = (data: any) => {
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

// Initialize Firestore with better error handling
let db: admin.firestore.Firestore | null = null;
try {
  db = initializeFirebase();
  logger.info('Firestore initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Firestore:', error);
  // Don't throw here, let the application continue but log the error
}

// Create indexes for frequently queried fields
const createIndexes = async () => {
  if (!db) {
    logger.error('Cannot create indexes: Firestore not initialized');
    return;
  }

  try {
    // Create collections and indexes
    const collections = Object.values(COLLECTIONS);
    for (const collection of collections) {
      const collectionRef = db.collection(collection);
      await collectionRef.doc('_dummy').set({ 
        _dummy: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      await collectionRef.doc('_dummy').delete();
    }
    
    logger.info('Firestore indexes created successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating indexes';
    logger.error('Error creating Firestore indexes:', { error: errorMessage });
  }
};

// Export the db instance
export { db };

// Call createIndexes when the app starts
if (db) {
  createIndexes().catch(error => {
    logger.error('Failed to create indexes:', error);
  });
}