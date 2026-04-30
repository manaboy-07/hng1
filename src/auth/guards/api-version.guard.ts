import {
  CanActivate,
  Injectable,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ApiVersionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const url = request.url;

    const isProfileRoute = url.startsWith('/api/profiles');

    if (!isProfileRoute) {
      return true;
    }

    const version = request.headers['x-api-version'];

    if (!version) {
      throw new BadRequestException({
        status: 'error',
        message: 'API version header required',
      });
    }

    if (version !== '1') {
      throw new BadRequestException({
        status: 'error',
        message: 'Unsupported API version',
      });
    }

    return true;
  }
}
