import { db, COLLECTIONS, validateEmployee, validateOrganization, validateRemark } from '../config/firebase';
import { WebhookEvent, Employee, Organization, Remark } from '../types/webhook.types';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

export class WebhookService {
  private async saveToFirestore(collection: string, data: any) {
    try {
      // Check if Firestore is initialized
      if (!db) {
        throw new AppError(500, 'Firestore database is not initialized');
      }

      // Validate data based on collection type
      switch (collection) {
        case COLLECTIONS.EMPLOYEES:
          validateEmployee(data);
          break;
        case COLLECTIONS.ORGANIZATIONS:
          validateOrganization(data);
          break;
        case COLLECTIONS.REMARKS:
          validateRemark(data);
          break;
      }

      const docRef = await db.collection(collection).add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      logger.info(`Document saved with ID: ${docRef.id}`, {
        collection,
        documentId: docRef.id
      });
      
      return docRef.id;
    } catch (error) {
      logger.error('Error saving to Firestore:', error);
      throw error;
    }
  }

  async handleSyncEvent(event: WebhookEvent) {
    try {
      // Check if Firestore is initialized
      if (!db) {
        throw new AppError(500, 'Firestore database is not initialized');
      }

      switch (event.event) {
        case 'sync.events.initiated':
          await this.saveToFirestore(COLLECTIONS.SYNC_EVENTS, {
            type: 'initiated',
            ...event
          });
          break;

        case 'sync.events.employee.add':
          const employees = event.body as Employee[];
          for (const employee of employees) {
            await this.saveToFirestore(COLLECTIONS.EMPLOYEES, {
              ...employee,
              orgId: event.orgId,
              syncType: event.eventType,
              vendor: event['vendor.orgId']
            });
          }
          break;

        case 'sync.events.employee.update':
          const updatedEmployees = event.body as Employee[];
          for (const employee of updatedEmployees) {
            if (!db) {
              throw new AppError(500, 'Firestore database is not initialized');
            }
            
            const snapshot = await db
              .collection(COLLECTIONS.EMPLOYEES)
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
          await this.saveToFirestore(COLLECTIONS.SYNC_EVENTS, {
            type: 'completed',
            ...event
          });
          break;
      }
    } catch (error) {
      logger.error('Error handling sync event:', error);
      throw error;
    }
  }

  async handleConnectionEvent(event: WebhookEvent) {
    try {
      const organization = event.body[0] as Organization;
      
      switch (event.event) {
        case 'connection.events.requested':
        case 'connection.events.accepted':
        case 'connection.events.failed':
        case 'connection.events.terminated':
          await this.saveToFirestore(COLLECTIONS.ORGANIZATIONS, {
            ...organization,
            eventType: event.event,
            timestamp: event.timeStamp,
            vendor: event['vendor.orgId']
          });
          break;
      }
    } catch (error) {
      logger.error('Error handling connection event:', error);
      throw error;
    }
  }

  async handleRemarkEvent(event: WebhookEvent) {
    try {
      const remark = event.body[0] as Remark;
      await this.saveToFirestore(COLLECTIONS.REMARKS, {
        ...remark,
        orgId: event.orgId,
        timestamp: event.timeStamp,
        vendor: event['vendor.orgId']
      });
    } catch (error) {
      logger.error('Error handling remark event:', error);
      throw error;
    }
  }
}