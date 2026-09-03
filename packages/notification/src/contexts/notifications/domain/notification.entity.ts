export enum NotificationType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
}

export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly message: string,
    public readonly metadata: Record<string, unknown>,
    public readonly read: boolean,
    public readonly createdAt: Date,
  ) {}
}
