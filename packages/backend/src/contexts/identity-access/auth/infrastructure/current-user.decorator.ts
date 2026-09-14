import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type RequestWithUser = {
  user: {
    id: string;
    email: string;
    role: 'CLIENT' | 'ADMIN';
  };
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
