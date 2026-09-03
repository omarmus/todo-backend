import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationType } from '../domain/notification.entity';
import {
  NotificationRepository,
  CreateNotificationData,
} from '../domain/notification.repository';
import {
  NotificationDocument,
  NotificationSchema,
} from './mongoose-notification.schema';

@Injectable()
export class MongooseNotificationRepository implements NotificationRepository {
  constructor(
    @InjectModel(NotificationSchema.name)
    private readonly model: Model<NotificationDocument>,
  ) {}

  private toDomain(doc: NotificationDocument): Notification {
    return new Notification(
      doc._id.toString(),
      doc.userId,
      doc.type as NotificationType,
      doc.title,
      doc.message,
      doc.metadata,
      doc.read,
      doc.createdAt,
    );
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const docs = await this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => this.toDomain(d));
  }

  async findById(id: string): Promise<Notification | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    const doc = await this.model.create(data);
    return this.toDomain(doc);
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, { read: true }, { new: true })
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async deleteItem(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }
}
