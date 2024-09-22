import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Token } from "./entities/token.entity";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "../users/users.module";

@Module({
  providers: [TokensService],
  imports: [
    TypeOrmModule.forFeature([Token]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'DEV',
    }),
    ConfigModule,
    UsersModule
  ],
  exports: [TokensService]
})
export class TokensModule {}
