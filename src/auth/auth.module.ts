import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'DEV',
      signOptions: {expiresIn: '30d'}
    }),
    UsersModule
  ],
  exports: [AuthService],
})
export class AuthModule {}
