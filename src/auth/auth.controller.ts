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
import * as dotenv from 'dotenv';
dotenv.config();

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('github')
  @UseGuards(GithubAuthGuard)
  async github() {}

  @Public()
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req: any, @Res() res: Response) {
    try {
      console.log('🔵 GitHub callback hit');
      console.log('USER:', req.user);

      if (!req.user) {
        return res.status(401).send('OAuth failed: no user returned');
      }

      const tokens = await this.authService.valaidateOauthUSer(req.user);

      if (!tokens) {
        return res.status(500).send('Token generation failed');
      }

      const isProd = process.env.NODE_ENV! === 'production';

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

      const isCLI = req.query.state === 'cli';

      if (isCLI) {
        return res.redirect(
          `http://localhost:4242/callback?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`,
        );
      }

      return res.redirect(`${process.env.FRONTEND_URL!}/dashboard`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      return res.status(500).send('OAuth callback failed');
    }
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
