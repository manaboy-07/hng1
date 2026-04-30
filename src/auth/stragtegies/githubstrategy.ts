import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,

      callbackURL:
        process.env.GITHUB_CALLBACK ||
        'https://hng1-production-f8e7.up.railway.app/auth/github/callback',

      scope: ['user:email'],
    });
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    const { username, emails, photos, id } = profile;
    const user = {
      github_id: id,
      username: username,
      email: emails?.[0]?.value,
      avatar_url: photos?.[0]?.value,
    };
    done(null, user);
  }
}
