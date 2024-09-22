import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { ConfigService } from "@nestjs/config";
import { TokenPayload } from "../common/types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
  constructor(private readonly usersService: UsersService,
              private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'DEV',
    });
  }

  async validate(payload: TokenPayload){
    if(payload.type !== 'access')
      throw new UnauthorizedException('Invalid token type');

    return await this.usersService.getUserById(payload.id);
  }
}