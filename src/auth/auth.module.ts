import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { JwtStrategy } from "./jwt.strategy";
import { TokensModule } from "../tokens/tokens.module";

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    UsersModule,
    TokensModule,
  ],
  exports: [AuthService],
})
export class AuthModule {}
