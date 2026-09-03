import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<NotificationSchema>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'notifications' })
export class NotificationSchema {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: ['TASK_CREATED', 'TASK_COMPLETED', 'TASK_DUE_SOON'] })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop({ default: false })
  read: boolean;

  createdAt: Date;
}

export const NotificationSchemaFactory =
  SchemaFactory.createForClass(NotificationSchema);
