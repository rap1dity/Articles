import { Module } from '@nestjs/common';
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.SECRET_KEY || 'DEV',
      signOptions: { expiresIn: '30d' }
    })
  ],
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule],
})
export class GuardsModule {}
