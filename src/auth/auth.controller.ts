import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { GithubAuthGuard } from './guards/github.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //triggers github strategy
  @Public()
  @Get('github')
  @UseGuards(GithubAuthGuard)
  async github() {}

  //call back redirection
  @Public()
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req) {
    //lobin user and return accesstoken
    return this.authService.valaidateOauthUSer(req.user);
  }
}
