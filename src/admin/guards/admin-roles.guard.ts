import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';
import { AdminRole } from '../schemas/admin.schema';
import { AdminJwtPayload } from '../types/admin-jwt-payload.type';

@Injectable()
export class AdminRolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
            ADMIN_ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<{
            user?: AdminJwtPayload;
        }>();

        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Admin user not found in request');
        }

        if (user.role === AdminRole.Admin) {
            return true;
        }

        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Insufficient admin permissions');
        }

        return true;
    }
}