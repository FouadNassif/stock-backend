import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AnyAuthGuard implements CanActivate {
  private readonly memberJwtAuthGuard = new (AuthGuard('jwt'))();
  private readonly adminJwtAuthGuard = new (AuthGuard('admin-jwt'))();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const adminResult = await this.adminJwtAuthGuard.canActivate(context);

      if (adminResult) {
        return true;
      }
    } catch (error: unknown) {
      void error;
    }

    try {
      const memberResult = await this.memberJwtAuthGuard.canActivate(context);

      if (memberResult) {
        return true;
      }
    } catch (error: unknown) {
      void error;
    }

    throw new UnauthorizedException('Valid member or admin token is required');
  }
}
