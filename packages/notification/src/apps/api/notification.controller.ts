import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationService } from '../../contexts/notifications/application/notification.service';
import { CreateNotificationDto } from '../../contexts/notifications/application/dto/create-notification.dto';
import { NotificationGateway } from './notification.gateway';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly gateway: NotificationGateway,
  ) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Obtener notificaciones de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones' })
  findAll(@Param('userId') userId: string) {
    return this.notificationService.findByUserId(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una notificación' })
  @ApiResponse({ status: 201, description: 'Notificación creada y enviada vía WebSocket' })
  async create(@Body() dto: CreateNotificationDto) {
    const notification = await this.notificationService.create(dto);
    this.gateway.sendNotificationToUser(dto.userId, notification);
    return notification;
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una notificación' })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiResponse({ status: 200, description: 'Notificación eliminada' })
  delete(@Param('id') id: string) {
    return this.notificationService.deleteItem(id);
  }
}
