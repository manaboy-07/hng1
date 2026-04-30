import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as dotenv from 'dotenv';

dotenv.config();
@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async valaidateOauthUSer(profile: any) {
    //find user in db with githubid else create user to the db
    let user = await this.prismaService.user.findUnique({
      where: { github_id: profile.id },
    });
    if (!user) {
      user = await this.prismaService.user.create({
        data: {
          github_id: profile.id,
          username: profile.username,
          email: profile.email,
          avatar_url: profile.avatar,
        },
      });
    }
    //generate token for the user hence authenticate them. This is where jwtauthguard comes usefeul
    const tokens = this.generateToken(user);
    //store user refresh token
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        refresh_token: tokens.refresh_token,
      },
    });
    return tokens;
  }

  generateToken(user: any) {
    const payload = {
      sub: user.id, //willl be used for refresh token too
      role: user.role,
      github_id: user.github_id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
    };
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '3m',
    });
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '5m',
    });

    return {
      access_token,
      refresh_token,
    };
  }

  async validateAndUpdateRefreshToken(refresh_token: string) {
    const payload = this.jwtService.verify(refresh_token);
    console.log(payload);

    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.refresh_token !== refresh_token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = this.generateToken(user);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        refresh_token: tokens.refresh_token,
      },
    });

    return tokens;
  }
  async logOut(refresh_token: string) {
    const payload = this.jwtService.verify(refresh_token);
    await this.prismaService.user.update({
      where: { id: payload.sub },
      data: {
        refresh_token: null,
      },
    });
    return {
      status: 'success',
    };
  }
  //Admins them
  async getAdminUser() {
    return this.prismaService.user.findFirst({
      where: { role: 'ADMIN' },
    });
  }

  async createTestAdmin() {
    return this.prismaService.user.create({
      data: {
        github_id: 'test_admin',
        username: 'test_admin',
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    });
  }
  // auth.service.ts
  // auth.service.ts

  async handleManualGithubAuth(code: string, codeVerifier: string) {
    try {
      // 1. Exchange code for GitHub Access Token
      // Note: We don't send code_verifier to GitHub here because
      // GitHub uses Client Secret for "Web Application" types.
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri:
            'https://hng1-production-f8e7.up.railway.app/auth/github/callback', // Must match GitHub Settings!
        },
        { headers: { Accept: 'application/json' } },
      );

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
        console.error('GitHub Token Exchange Failed:', tokenResponse.data);
        return null;
      }

      // 2. Get User Profile
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const profile = userResponse.data;

      // 3. Find/Create User in your DB and return JWTs
      // Pass the profile to your existing logic
      return await this.valaidateOauthUSer({
        github_id: profile.id.toString(),
        username: profile.login,
        email: profile.email || `${profile.login}@github.com`,
        avatar_url: profile.avatar_url,
      });
    } catch (error) {
      console.error(
        'Manual Auth Error:',
        error.response?.data || error.message,
      );
      return null;
    }
  }
}
