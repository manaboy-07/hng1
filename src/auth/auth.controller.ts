import {
  Body,
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
import type { Response } from 'express';
import { GithubAuthGuard } from './guards/github.guard';
import { Public } from './decorators/public.decorator';
import { JWTAuthGuard } from './guards/jwt.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60 } })
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
  async githubCallback(@Req() req, @Res() res: Response) {
    const tokens = await this.authService.valaidateOauthUSer(req.user);

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // redirect to frontend
    return res.redirect('https://insighta-dun.vercel.app/dashboard');
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req, @Res() res: Response) {
    const refreshToken = req.cookies.refresh_token;

    const tokens =
      await this.authService.validateAndUpdateRefreshToken(refreshToken);

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    return tokens;
  }

  @Public()
  @Post('logout')
  async logOut(@Body() body: { refresh_token: string }, @Res() res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return await this.authService.logOut(body.refresh_token);
  }

  @Get('me')
  async me(@Req() req) {
    return {
      user: req.user,
    };
  }
}
