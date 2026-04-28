import {
  CanActivate,
  BadRequestException,
  Injectable,
  ExecutionContext,
} from '@nestjs/common';
import { Observable } from 'rxjs';
@Injectable()
export class ApiVersionGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const version = request.headers['x-api-version'];
    if (!version) {
      throw new BadRequestException({
        staus: 'error',
        message: 'API verion header required',
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
