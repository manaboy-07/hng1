import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  // This allows us to handle the error manually instead of Passport's default behavior
  handleRequest(err, user, info, context) {
    const request = context.switchToHttp().getRequest();
    const { code, state } = request.query;

    // If there's an error or no user, but the controller needs to validate missing params
    if (err || !user) {
      // We don't throw an error here; we let it pass to the controller
      // so the controller can return the specific "Missing code" JSON.
      return null;
    }
    return user;
  }
}
