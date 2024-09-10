import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable, Query,
  UnauthorizedException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Article } from "./entities/article.entity";
import { Between, Like, Repository } from "typeorm";
import { CreateArticleDto } from "./dto/create-article.dto";
import Redis from "ioredis";
import { UsersService } from "../users/users.service";

interface FindAllQuery {
  page: number;
  limit: number;
  published?: string;
  author?: string;
}

@Injectable()
export class ArticleService {
  constructor(@InjectRepository(Article)
              private readonly articleRepository: Repository<Article>,
              private readonly usersService: UsersService,
              @Inject('REDIS_CLIENT')
              private readonly redisClient: Redis) {}

  async create(dto: CreateArticleDto, userId: number){
    const user = await this.usersService.getUserById(userId);
    const published = new Date().toISOString().split('T')[0]
    const article = this.articleRepository.create({...dto, published: published, author: user});

    return await this.articleRepository.save(article);
  }

  async getAll(query: FindAllQuery){
    const {page, limit, published, author} = query;
    const take = limit;
    const skip = (page - 1) * take;

    const whereConditions: any = {}

    if(published) {
      whereConditions.published = published;
    }

    if(author){
      const candidate = await this.usersService.getUsersByUsername(author);
      if(!candidate)
        return {
          data: [],
          total: 0
        }
      whereConditions.author = candidate;
    }

    const [result, total] = await this.articleRepository.findAndCount({
      where: whereConditions,
      relations: ['author'],
      order: { published: 'ASC' },
      take,
      skip
    });

    return {
      data: result,
      total
    }
  }

  async getOneById(articleId: number){
    const cachedArticle = await this.redisClient.get(`article:${articleId}`);
    if (cachedArticle) {
      return JSON.parse(cachedArticle);
    }

    const article = await this.articleRepository.findOne({where: {id: articleId}});
    if(!article)
      throw new HttpException(`Article with id ${articleId} not found`, HttpStatus.BAD_REQUEST);

    await this.redisClient.set(`article:${articleId}`, JSON.stringify(article), 'EX', 60)

    return article;
  }

  async update(articleId: number, dto: CreateArticleDto, userId: number) {
    const user = await this.usersService.getUserById(userId);
    const article = await this.articleRepository.findOne({where: {id: articleId}, relations: ['author']});
    if(!article)
      throw new HttpException(`Article with id ${articleId} not found`, HttpStatus.BAD_REQUEST);
    if(article.author.id !== user.id)
      throw new ForbiddenException({message: 'access denied'});

    const result = await this.articleRepository.update(articleId, dto);
    await this.redisClient.set(`article:${articleId}`, JSON.stringify(article), 'EX', 60);

    return result;
  }

  async delete(articleId: number, userId: number){
    const user = await this.usersService.getUserById(userId);
    const article = await this.articleRepository.findOne({where: {id: articleId}, relations: ['author']});
    if(!article)
      throw new HttpException(`Article with id ${articleId} not found`, HttpStatus.BAD_REQUEST);
    if(article.author.id !== user.id)
      throw new ForbiddenException({message: 'access denied'});

    const result = await this.articleRepository.delete(articleId);
    await this.redisClient.del(`article:${articleId}`);

    return result;
  }
}
