import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';
import { AdminRole } from '../schemas/admin.schema';
import type { AdminJwtPayload } from '../types/admin-jwt-payload.type';

@Injectable()
export class AdminRolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles =
            this.reflector.getAllAndOverride<AdminRole[]>(ADMIN_ROLES_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ?? [];

        if (requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<{ user?: AdminJwtPayload; }>();

        const currentAdmin = request.user;

        if (!currentAdmin) {
            throw new ForbiddenException('Admin access required');
        }

        if (currentAdmin.role === AdminRole.Admin) {
            return true;
        }

        if (!requiredRoles.includes(currentAdmin.role)) {
            throw new ForbiddenException('You do not have permission for this action');
        }

        return true;
    }
}