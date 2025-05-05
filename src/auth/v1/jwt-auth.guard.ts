/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/auth/jwt-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();

    const excludedRoutes = [
      { path: '/v1/auth/login', method: 'POST' },
      { path: '/v1/auth/register', method: 'POST' },
      { path: '/v1/url/redirect', method: 'GET' },
    ];

    const isExcluded = excludedRoutes.some(
      (route) =>
        route.path === request.route?.path && route.method === request.method,
    );

    if (isExcluded) {
      return true;
    }

    const result = (await super.canActivate(context)) as boolean;

    if (!result) {
      throw new UnauthorizedException('Unauthorized access: Invalid token.');
    }

    return result;
  }

  handleRequest(err, user) {
    if (err || !user) {
      throw new UnauthorizedException(
        'Unauthorized access: Invalid or missing token.',
      );
    }
    return user;
  }
}
