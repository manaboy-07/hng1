import { AuthGuard } from '@nestjs/passport';

export class GithubAuthGuard extends AuthGuard('github') {}
