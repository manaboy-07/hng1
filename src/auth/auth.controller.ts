import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { GithubAuthGuard } from './guards/github.guard';
import { JWTAuthGuard } from './guards/jwt.guard';
import { Public } from './decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // =========================
  // GITHUB OAUTH START
  // =========================
  @Public()
  @Get('github')
  @UseGuards(GithubAuthGuard)
  async github() {}

  // =========================
  // GITHUB CALLBACK (MAIN FIX)
  // =========================
  @Public()
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const tokens = await this.authService.valaidateOauthUSer(req.user);

    const isProd = process.env.NODE_ENV === 'production';

    // 🔐 ACCESS TOKEN COOKIE
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: isProd, // MUST be true in production
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    // 🔐 REFRESH TOKEN COOKIE
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ REDIRECT TO FRONTEND
    return res.redirect(
      process.env.FRONTEND_URL || 'http://localhost:3000/dashboard',
    );
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    const tokens =
      await this.authService.validateAndUpdateRefreshToken(refreshToken);

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return res.json(tokens);
  }

  @Public()
  @Post('logout')
  async logOut(@Body() body: { refresh_token: string }, @Res() res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    await this.authService.logOut(body.refresh_token);

    return res.json({ message: 'Logged out' });
  }

  @UseGuards(JWTAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    return {
      user: req.user,
    };
  }
}
