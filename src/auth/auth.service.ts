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
  async handleManualGithubAuth(code: string, codeVerifier: string) {
    try {
      // 1. Exchange code for GitHub token
      const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          code_verifier: codeVerifier, // PKCE
        },
        { headers: { Accept: 'application/json' } },
      );

      if (!response.data.access_token) return null;

      // 2. Get User
      const userRes = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${response.data.access_token}` },
      });

      // 3. Your existing user validation/JWT generation
      return await this.valaidateOauthUSer({
        github_id: userRes.data.id.toString(),
        username: userRes.data.login,
        email: userRes.data.email,
        avatar_url: userRes.data.avatar_url,
      });
    } catch (e) {
      return null;
    }
  }
}
