import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

export class GithubAuthGuard extends AuthGuard('github') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    return {
      state: req.query.state || 'web',
    };
  }
}
