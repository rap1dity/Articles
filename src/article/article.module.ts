import { Module } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { GuardsModule } from "../guards/guards.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Article } from "./entities/article.entity";
import { User } from "../users/entities/user.entity";
import { RedisModule } from "../redis/redis.module";
import { UsersModule } from "../users/users.module";

@Module({
  controllers: [ArticleController],
  providers: [ArticleService],
  imports: [
    RedisModule,
    TypeOrmModule.forFeature([Article]),
    UsersModule,
    GuardsModule,
  ]
})
export class ArticleModule {}
