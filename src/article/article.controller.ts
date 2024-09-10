import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ArticleService } from "./article.service";
import { ValidationPipe } from "../pipes/validation.pipe";
import { Article } from "./entities/article.entity";
import { CreateArticleDto } from "./dto/create-article.dto";
import { User } from "../decorators/user.decorator";
import { User as UserEntity } from "../users/entities/user.entity";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@ApiTags('Article')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @ApiOperation({summary: 'Create Article'})
  @ApiResponse({status: 200, type: Article})
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateArticleDto,
               @User() user: UserEntity){
    return await this.articleService.create(dto, user.id);
  }

  @ApiOperation({summary: 'Get all User Articles'})
  @ApiResponse({status: 200, type: Article})
  @Get()
  async getAll(@Query('page') page: number = 1,
               @Query('limit') limit: number = 10,
               @Query('published') published?: string,
               @Query('author') author?: string){
    return await this.articleService.getAll({page, limit, published, author});
  }

  @ApiOperation({summary: 'Get User Article by id'})
  @ApiResponse({status: 200, type: Article})
  @Get(':articleId')
  async getOneById(@Param('articleId', ParseIntPipe) articleId: number){
    return await this.articleService.getOneById(articleId);
  }

  @ApiOperation({summary: 'Update existing User Article'})
  @ApiResponse({status: 200, type: Article})
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAuthGuard)
  @Put(':articleId')
  async update(@Param('articleId', ParseIntPipe) articleId: number,
               @Body() dto: CreateArticleDto,
               @User() user: UserEntity){
    return await this.articleService.update(articleId, dto, user.id);
  }

  @ApiOperation({summary: 'Delete existing User Article'})
  @ApiResponse({status: 200})
  @UseGuards(JwtAuthGuard)
  @Delete(':articleId')
  async delete(@Param('articleId', ParseIntPipe) articleId: number,
               @User() user: UserEntity){
    return await this.articleService.delete(articleId, user.id);
  }
}
