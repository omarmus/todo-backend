import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from '../domain/notification.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async findByUserId(userId: string) {
    return this.notificationRepository.findByUserId(userId);
  }

  async findOne(id: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return notification;
  }

  async create(dto: CreateNotificationDto) {
    return this.notificationRepository.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      metadata: dto.metadata || {},
    });
  }

  async markAsRead(id: string) {
    await this.findOne(id);
    return this.notificationRepository.markAsRead(id);
  }

  async deleteItem(id: string) {
    await this.findOne(id);
    return this.notificationRepository.deleteItem(id);
  }
}
