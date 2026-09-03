import { Notification } from './notification.entity';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
}

export abstract class NotificationRepository {
  abstract findByUserId(userId: string): Promise<Notification[]>;
  abstract findById(id: string): Promise<Notification | null>;
  abstract create(data: CreateNotificationData): Promise<Notification>;
  abstract markAsRead(id: string): Promise<Notification | null>;
  abstract deleteItem(id: string): Promise<void>;
}
