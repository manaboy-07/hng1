import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { GithubAuthGuard } from './guards/github.guard';
import { JWTAuthGuard } from './guards/jwt.guard';
import { Public } from './decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import * as dotenv from 'dotenv';
dotenv.config();
@Throttle({ default: { limit: 10, ttl: 60 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('github')
  @UseGuards(GithubAuthGuard)
  github() {}

  @Public()
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req: any, @Res() res: Response) {
    const { code, state } = req.query;

    if (!code) {
      throw new BadRequestException('Missing code');
    }

    if (!state) {
      throw new BadRequestException('Missing state');
    }

    if (!req.user) {
      throw new UnauthorizedException('Invalid OAuth user');
    }

    const tokens = await this.authService.valaidateOauthUSer(req.user);

    if (state === 'test' || state === 'api') {
      return res.json({
        status: 'success',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
    }

    if (state === 'cli') {
      return res.redirect(
        `http://localhost:4242/callback?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`,
      );
    }

    return res.redirect(`${process.env.FRONTEND_URL!}`);
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new BadRequestException('No refresh token');
    }

    const tokens =
      await this.authService.validateAndUpdateRefreshToken(refreshToken);

    return res.json({
      status: 'success',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new BadRequestException('No refresh token');
    }

    await this.authService.logOut(refreshToken);

    return {
      status: 'success',
      message: 'Logged out',
    };
  }
  @UseGuards(JWTAuthGuard)
  @Get('me')
  me(@Req() req) {
    return {
      user: req.user,
    };
  }
}
