import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async valaidateOauthUSer(profile: any) {
    //find user in db with githubid else create user to the db
    let user = await this.prismaService.user.findUnique({
      where: { github_id: profile.githubId },
    });
    if (!user) {
      user = await this.prismaService.user.create({
        data: {
          github_id: profile.githubId,
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
      github_id: user.githubId,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
    };
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '1d',
    });
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '1d',
    });

    return {
      access_token,
      refresh_token,
    };
  }

  async validateAndUpdateRefreshToken(refresh_token: string) {
    const payload = this.jwtService.verify(refresh_token);
    //refresh token is already stored in the db
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
    });
    //check if user exists or if refresh token matches
    if (!user || user.refresh_token !== refresh_token) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    //rotate tokens
    const tokens = this.generateToken(user);
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        refresh_token: tokens.refresh_token,
      },
    });
    return {
      status: 'success',
      ...tokens,
    };
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
}
