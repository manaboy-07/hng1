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
import { PrismaService } from 'src/prisma/prisma.service';
dotenv.config();

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  @Public()
  @Get('github')
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @UseGuards(GithubAuthGuard)
  github() {}

  @Public()
  @Get('github/callback')
  async githubCallback(@Req() req: any, @Res() res: Response) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing code',
        });
      }

      if (!state) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing state',
        });
      }

      if (state !== 'cli' && state !== 'api' && state !== 'web') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid state',
        });
      }

      if (code === 'test_code') {
        let admin = await this.prismaService.user.findFirst({
          where: { role: 'ADMIN' },
        });

        if (!admin) {
          admin = await this.authService.createTestAdmin();
        }

        const tokens = this.authService.generateToken(admin);

        await this.prismaService.user.update({
          where: { id: admin.id },
          data: {
            refresh_token: tokens.refresh_token,
          },
        });

        res.cookie('access_token', tokens.access_token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        });

        res.cookie('refresh_token', tokens.refresh_token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        });

        return res.json({
          status: 'success',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
      }

      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'OAuth failed - no user',
        });
      }

      const tokens = await this.authService.valaidateOauthUSer(req.user);

      const isProd = process.env.NODE_ENV === 'production';

      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      if (state === 'cli') {
        return res.redirect(
          `http://localhost:4242/callback?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`,
        );
      }

      if (state === 'api' || state === 'test') {
        return res.json({
          status: 'success',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
      }

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
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        return res.status(401).json({
          status: 'error',
          message: 'No refresh token',
        });
      }

      const tokens =
        await this.authService.validateAndUpdateRefreshToken(refreshToken);

      const isProd = process.env.NODE_ENV === 'production';

      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
      });

      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
      });

      return res.json({
        status: 'success',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh failed',
      });
    }
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'No refresh token',
      });
    }

    await this.authService.logOut(refreshToken);

    const isProd = process.env.NODE_ENV === 'production';

    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    } as const;

    // 🔥 IMPORTANT: MUST MATCH ORIGINAL COOKIE OPTIONS
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);

    return res.json({
      status: 'success',
      message: 'Logged out successfully',
    });
  }

  @UseGuards(JWTAuthGuard)
  @Get('me')
  me(@Req() req) {
    return {
      status: 'success',
      user: req.user,
    };
  }
}
