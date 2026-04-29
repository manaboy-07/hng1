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
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'OAuth failed - no user returned',
        });
      }

      const tokens = await this.authService.valaidateOauthUSer(req.user);

      const isProd = process.env.NODE_ENV === 'production';

      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
      });

      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
      });

      return res.redirect(process.env.FRONTEND_URL!);
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        status: 'error',
        message: 'OAuth callback failed',
      });
    }
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
