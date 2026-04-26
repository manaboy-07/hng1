import { Injectable } from '@nestjs/common';
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
    //generate token for the user
    return this.generateToken(user);
  }

  generateToken(user: any) {
    const access_token = this.jwtService.sign({
      sub: user.id,
      role: user.role,
    });

    return {
      access_token,
    };
  }
}
