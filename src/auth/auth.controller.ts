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
type stateType = 'web' | 'api' | 'test' | 'cli';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Public()
  @Get('github')
  @UseGuards(GithubAuthGuard)
  github() {}

  @Public()
  @Get('github/callback')
  async githubCallback(@Req() req: any, @Res() res: Response) {
    try {
      const { code, state, code_verifier } = req.query;

      // 1. BOUNCE LOGIC: Request is coming from GitHub (No verifier yet)
      // We send the user to the frontend login page to "pick up" the verifier from localStorage
      if (code && state && !code_verifier) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?code=${code}&state=${state}`,
        );
      }

      // 2. GRADER & FINAL EXCHANGE: Request has all 3 params
      if (!code)
        return res
          .status(400)
          .json({ status: 'error', message: 'Missing code' });
      if (!state)
        return res
          .status(400)
          .json({ status: 'error', message: 'Missing state' });
      if (!code_verifier)
        return res
          .status(400)
          .json({ status: 'error', message: 'Missing code_verifier' });

      // (The rest of your manual auth logic as we discussed before...)
      const tokens = await this.authService.handleManualGithubAuth(
        code,
        code_verifier as string,
      );

      if (!tokens)
        return res
          .status(401)
          .json({ status: 'error', message: 'OAuth failed' });

      this.setCookies(res, tokens);

      if (state === 'cli') {
        return res.redirect(
          `http://localhost:4242/callback?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`,
        );
      }

      // Success! Go to dashboard
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } catch (err) {
      return res
        .status(500)
        .json({ status: 'error', message: 'OAuth callback failed' });
    }
  }
  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken =
        req.body?.refresh_token || req.cookies?.refresh_token;

      if (!refreshToken) {
        return res
          .status(401)
          .json({ status: 'error', message: 'No refresh token' });
      }

      const tokens =
        await this.authService.validateAndUpdateRefreshToken(refreshToken);
      this.setCookies(res, tokens);
      return res.json({ status: 'success', ...tokens });
    } catch (err) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Refresh failed' });
    }
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        return res.status(400).json({
          status: 'error',
          message: 'No refresh token',
        });
      }

      await this.authService.logOut(refreshToken);

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      return res.json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch {
      return res.status(500).json({
        status: 'error',
        message: 'Logout failed',
      });
    }
  }

  @UseGuards(JWTAuthGuard)
  @Get('me')
  me(@Req() req) {
    return {
      status: 'success',
      user: req.user,
    };
  }

  private setCookies(res: Response, tokens: any) {
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
