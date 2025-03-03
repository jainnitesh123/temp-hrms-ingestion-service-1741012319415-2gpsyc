"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const firebase_1 = require("../config/firebase");
const logger_1 = require("../utils/logger");
const error_middleware_1 = require("../middleware/error.middleware");
class WebhookService {
    async saveToFirestore(collection, data) {
        try {
            // Check if Firestore is initialized
            if (!firebase_1.db) {
                throw new error_middleware_1.AppError(500, 'Firestore database is not initialized');
            }
            // Validate data based on collection type
            switch (collection) {
                case firebase_1.COLLECTIONS.EMPLOYEES:
                    (0, firebase_1.validateEmployee)(data);
                    break;
                case firebase_1.COLLECTIONS.ORGANIZATIONS:
                    (0, firebase_1.validateOrganization)(data);
                    break;
                case firebase_1.COLLECTIONS.REMARKS:
                    (0, firebase_1.validateRemark)(data);
                    break;
            }
            const docRef = await firebase_1.db.collection(collection).add({
                ...data,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            logger_1.logger.info(`Document saved with ID: ${docRef.id}`, {
                collection,
                documentId: docRef.id
            });
            return docRef.id;
        }
        catch (error) {
            logger_1.logger.error('Error saving to Firestore:', error);
            throw error;
        }
    }
    async handleSyncEvent(event) {
        try {
            // Check if Firestore is initialized
            if (!firebase_1.db) {
                throw new error_middleware_1.AppError(500, 'Firestore database is not initialized');
            }
            switch (event.event) {
                case 'sync.events.initiated':
                    await this.saveToFirestore(firebase_1.COLLECTIONS.SYNC_EVENTS, {
                        type: 'initiated',
                        ...event
                    });
                    break;
                case 'sync.events.employee.add':
                    const employees = event.body;
                    for (const employee of employees) {
                        await this.saveToFirestore(firebase_1.COLLECTIONS.EMPLOYEES, {
                            ...employee,
                            orgId: event.orgId,
                            syncType: event.eventType,
                            vendor: event['vendor.orgId']
                        });
                    }
                    break;
                case 'sync.events.employee.update':
                    const updatedEmployees = event.body;
                    for (const employee of updatedEmployees) {
                        if (!firebase_1.db) {
                            throw new error_middleware_1.AppError(500, 'Firestore database is not initialized');
                        }
                        const snapshot = await firebase_1.db
                            .collection(firebase_1.COLLECTIONS.EMPLOYEES)
                            .where('id', '==', employee.id)
                            .where('orgId', '==', event.orgId)
                            .get();
                        if (!snapshot.empty) {
                            await snapshot.docs[0].ref.update({
                                ...employee,
                                updatedAt: new Date(),
                                vendor: event['vendor.orgId']
                            });
                        }
                    }
                    break;
                case 'sync.events.completed':
                    await this.saveToFirestore(firebase_1.COLLECTIONS.SYNC_EVENTS, {
                        type: 'completed',
                        ...event
                    });
                    break;
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling sync event:', error);
            throw error;
        }
    }
    async handleConnectionEvent(event) {
        try {
            const organization = event.body[0];
            switch (event.event) {
                case 'connection.events.requested':
                case 'connection.events.accepted':
                case 'connection.events.failed':
                case 'connection.events.terminated':
                    await this.saveToFirestore(firebase_1.COLLECTIONS.ORGANIZATIONS, {
                        ...organization,
                        eventType: event.event,
                        timestamp: event.timeStamp,
                        vendor: event['vendor.orgId']
                    });
                    break;
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling connection event:', error);
            throw error;
        }
    }
    async handleRemarkEvent(event) {
        try {
            const remark = event.body[0];
            await this.saveToFirestore(firebase_1.COLLECTIONS.REMARKS, {
                ...remark,
                orgId: event.orgId,
                timestamp: event.timeStamp,
                vendor: event['vendor.orgId']
            });
        }
        catch (error) {
            logger_1.logger.error('Error handling remark event:', error);
            throw error;
        }
    }
}
exports.WebhookService = WebhookService;
