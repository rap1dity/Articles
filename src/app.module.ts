import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from './auth/auth.module';
import databaseConfig from './common/config/database'
import { DataSource } from "typeorm";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArticleModule } from './article/article.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { TokensModule } from './tokens/tokens.module';

const typeOrmConfig = {
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
      isGlobal: true
    }),
  ],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) =>
    configService.get('database'),
  dataSourceFactory: async (options) => new DataSource(options).initialize()
}

@Module({
  controllers: [],
  providers: [],
  imports: [
    TypeOrmModule.forRootAsync(typeOrmConfig),
    AuthModule,
    ArticleModule,
    RedisModule,
    UsersModule,
    TokensModule,
  ],
})
export class AppModule {}
