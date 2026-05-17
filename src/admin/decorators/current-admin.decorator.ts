import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AdminJwtPayload } from '../types/admin-jwt-payload.type';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminJwtPayload => {
    const request = ctx.switchToHttp().getRequest<{
      user: AdminJwtPayload;
    }>();

    return request.user;
  },
);
