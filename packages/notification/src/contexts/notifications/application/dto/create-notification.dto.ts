import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../../domain/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID del usuario destinatario',
    example: 'user-id',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Tipo de notificación',
    enum: NotificationType,
    example: NotificationType.TASK_CREATED,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Título de la notificación',
    example: 'Nueva tarea',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Mensaje de la notificación',
    example: 'Se creó una nueva tarea',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Metadata adicional (taskId, etc.)',
    example: { taskId: 'task-id' },
  })
  @IsOptional()
  metadata?: Record<string, unknown>;
}
