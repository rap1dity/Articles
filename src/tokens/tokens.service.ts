import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Token } from "./entities/token.entity";
import { LessThan, Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import { v4 as uuidv4 } from 'uuid';
import { TokenPayload } from "../common/types";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";
import { toMs } from "ms-typescript";

@Injectable()
export class TokensService {
  constructor(@InjectRepository(Token)
              private readonly tokenRepository: Repository<Token>,
              private readonly jwtService: JwtService,
              private readonly configService: ConfigService,
              private readonly usersService: UsersService) {}


  private createToken(payload: TokenPayload, expiresIn: string) {
    return this.jwtService.sign({...payload}, {expiresIn});
  }

  async generateTokens(user: User, deviceId?: string) {
    deviceId = deviceId || uuidv4();

    const payload = {
      id: user.id,
      username: user.username,
      deviceId
    };

    const accessToken = this.createToken(
      {...payload, type: 'access'},
      this.configService.get<string>('ACCESS_TOKEN_LIFETIME') || '15m'
    );

    const refreshTokenId = uuidv4();
    const refreshToken = this.createToken(
      { ...payload, type: 'refresh', jti: refreshTokenId },
      this.configService.get<string>('REFRESH_TOKEN_LIFETIME') || '7d'
    );

    const refreshTokenExpiresAt = new Date(
      Date.now() + toMs(this.configService.get<string>('REFRESH_TOKEN_LIFETIME') || '7d')
    )

    await this.tokenRepository.save(
      this.tokenRepository.create({
        jti: refreshTokenId,
        user,
        deviceId,
        expiresAt: refreshTokenExpiresAt,
      })
    )

    await this.cleanUpExpiredTokens();
    return {
      accessToken,
      refreshToken,
      deviceId
    }
  }

  async refreshTokens(refreshToken: string){
    const payload = this.jwtService.verify(refreshToken);

    if(payload.type !== 'refresh')
      throw new UnauthorizedException('Invalid token type');

    const storedToken = await this.tokenRepository.findOne({
      where: { jti: payload.jti }
    })

    if(!storedToken)
      throw new UnauthorizedException('Invalid token');

    if(storedToken.revoked){
      await this.removeTokensForDevice(payload.deviceId);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    storedToken.revoked = true;
    await this.tokenRepository.save(storedToken);

    const user = await this.usersService.getUsersByUsername(payload.username);
    if(!user)
      throw new UnauthorizedException('User not found');

    return this.generateTokens(user, payload.deviceId);
  }

  verifyToken(refreshToken: string){
    return this.jwtService.verify(refreshToken)
  }

  async removeTokensForDevice(deviceId: string) {
    await this.tokenRepository.delete(
      { deviceId }
    );
  }

  async cleanUpExpiredTokens() {
    const now = new Date();
    await this.tokenRepository.delete({
      expiresAt: LessThan(now),
    });
  }
}
