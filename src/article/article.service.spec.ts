import { ArticleService } from "./article.service";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Article } from "./entities/article.entity";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import Redis from "ioredis";
import { UsersService } from "../users/users.service";
import { CreateArticleDto } from "./dto/create-article.dto";
import { ForbiddenException, HttpException } from "@nestjs/common";

interface FindAllQuery {
  page: number;
  limit: number;
  published?: string;
  author?: string;
}

describe('ArticleService', () => {
  let articleService: ArticleService;
  let articleRepository: Repository<Article>;
  let usersService: UsersService;
  let redisClient: Redis;

  const ARTICLE_REPOSITORY_TOKEN = getRepositoryToken(Article);
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: ARTICLE_REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserById: jest.fn(),
            getUsersByUsername: jest.fn(),
          },
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          }
        }
      ],
    }).compile()

    articleService = await module.get<ArticleService>(ArticleService);
    articleRepository = await module.get<Repository<Article>>(ARTICLE_REPOSITORY_TOKEN);
    usersService = await module.get<UsersService>(UsersService);
    redisClient = await module.get<Redis>('REDIS_CLIENT');
  });

  it('should create an article', async () => {
    // input
    const user = { id: 1, username: 'testuser', password: 'pass123' };
    const createArticleDto: CreateArticleDto = { title: 'Test Article', description: 'Content' };
    const today = new Date().toISOString().split('T')[0];

    // mocking
    (usersService.getUserById as jest.Mock).mockResolvedValue(user);

    (articleRepository.create as jest.Mock).mockReturnValue({
      ...createArticleDto,
      published: today,
      author: user,
    });

    (articleRepository.save as jest.Mock).mockResolvedValue({
      ...createArticleDto,
      published: today,
      author: user,
      id: 1,
    });

    // testing method
    const result = await articleService.create(createArticleDto, user.id);

    expect(result).toEqual({
      ...createArticleDto,
      published: today,
      author: user,
      id: 1,
    });
  })

  it('should return all articles with pagination and filters', async () => {
    // input
    const user = { id: 1, username: 'testuser', password: 'pass123' };
    const today = new Date().toISOString().split('T')[0];
    const query: FindAllQuery  = { page: 1, limit: 10, published: today, author: 't' };

    // received
    const article = {
      id: 1,
      title: 'Test Article',
      description: 'Content',
      published: today,
      author: user,
    };

    const articleList = [article];
    const totalArticles = articleList.length;

    // mocking
    (usersService.getUsersByUsername as jest.Mock).mockResolvedValue(user);
    (articleRepository.findAndCount as jest.Mock).mockResolvedValue([articleList, totalArticles]);

    // testing method
    const result = await articleService.getAll(query);

    expect(result).toEqual({
      data: articleList,
      total: totalArticles,
    })

    expect(usersService.getUsersByUsername).toHaveBeenCalledWith(query.author);

    expect(articleRepository.findAndCount).toHaveBeenCalledWith({
      where: {
        published: today,
        author: user,
      },
      relations: ['author'],
      order: { published: 'ASC' },
      take: query.limit,
      skip: (query.page - 1) * query.limit,
    });
  });

  it('should return an empty list if the author is not found', async () => {
    // input
    const today = new Date().toISOString().split('T')[0];
    const query: FindAllQuery = { page: 1, limit: 10, published: today, author: 'unknown' };

    // mocking
    (usersService.getUsersByUsername as jest.Mock).mockResolvedValue(null);

    // testing method
    const result = await articleService.getAll(query);

    expect(result).toEqual({
      data: [],
      total: 0,
    });

    expect(usersService.getUsersByUsername).toHaveBeenCalledWith(query.author);

    expect(articleRepository.findAndCount).not.toHaveBeenCalled();
  });

  it('should return the cached article from Redis', async () => {
    // input
    const articleId = 1;
    const today = new Date().toISOString().split('T')[0];

    // received
    const user = { id: 1, username: 'testuser', password: 'pass123' };
    const article = {
      id: 1,
      title: 'Test Article',
      description: 'Content',
      published: today,
      author: user,
    };

    // mocking
    (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(article));

    // testing method
    const result = await articleService.getOneById(1);
    expect(result).toEqual(article);

    expect(redisClient.get).toHaveBeenCalledWith(`article:${articleId}`);

    expect(usersService.getUserById).not.toHaveBeenCalled();
  })

  it('should return the article from database', async () => {
    // input
    const articleId = 1;
    const today = new Date().toISOString().split('T')[0];

    // received
    const user = { id: 1, username: 'testuser', password: 'pass123' };
    const article = {
      id: 1,
      title: 'Test Article',
      description: 'Content',
      published: today,
      author: user,
    };

    // mocking
    (redisClient.get as jest.Mock).mockResolvedValue(null);
    (articleRepository.findOne as jest.Mock).mockResolvedValue(article)

    // testing method
    const result = await articleService.getOneById(1);
    expect(result).toEqual(article);

    expect(redisClient.get).toHaveBeenCalledWith(`article:${articleId}`);

    expect(articleRepository.findOne).toHaveBeenCalledWith({where: { id: articleId }});

    expect(redisClient.set).toHaveBeenCalledWith(
      `article:${articleId}`,
      JSON.stringify(article),
      'EX',
      60,
    );
  });

  it('should update an existing article', async () => {
    // input
    const articleId = 1;
    const userId = 1;
    const updateDto: CreateArticleDto = { title: 'New title', description: 'New desc'}

    // received
    const user = { id: 1, username: 'testuser', password: 'pass123' };
    const article = {
      id: articleId,
      title: 'Old title',
      description: 'Old desc',
      author: user,
    };

    const updateResult = { affected: 1 };

    // mocking
    (usersService.getUserById as jest.Mock).mockResolvedValue(user);
    (articleRepository.findOne as jest.Mock).mockResolvedValue(article);
    (articleRepository.update as jest.Mock).mockResolvedValue(updateResult);

    // testing method
    const result = await articleService.update(articleId,updateDto,userId);

    expect(result).toEqual(updateResult);

    expect(articleRepository.update).toHaveBeenCalledWith(articleId, updateDto);

    expect(redisClient.set).toHaveBeenCalledWith(
      `article:${articleId}`,
      JSON.stringify(article),
      'EX',
      60,
    );
  });

  it('should throw a ForbiddenException if the user is not the author', async () => {
    // input
    const articleId = 1;
    const userId = 2;
    const updateDto: CreateArticleDto = { title: 'New title', description: 'New desc'}

    // received
    const user = { id: userId, username: 'anotheruser', password: 'pass444' };
    const article = {
      id: articleId,
      title: 'Old title',
      description: 'Old desc',
      author: { id: 1, username: 'testuser', password: 'pass123' },
    };

    // mocking
    (usersService.getUserById as jest.Mock).mockResolvedValue(user);
    (articleRepository.findOne as jest.Mock).mockResolvedValue(article);

    // testing method
    await expect(articleService.update(articleId, updateDto, userId)).rejects.toThrow(ForbiddenException);

    expect(articleRepository.update).not.toHaveBeenCalled();
  });

  it('should throw an HttpException if the article does not exist', async () => {
    // input
    const articleId = 999;
    const userId = 1;
    const updateDto = { title: 'Updated Title', description: 'Updated Content' };

    // received
    const user = { id: userId, username: 'testuser' };

    // mocking
    (usersService.getUserById as jest.Mock).mockResolvedValue(user);
    (articleRepository.findOne as jest.Mock).mockResolvedValue(null);

    // testing method
    await expect(articleService.update(articleId, updateDto, userId)).rejects.toThrow(HttpException);

    expect(articleRepository.update).not.toHaveBeenCalled();
  });

  it('should delete an existing article', async () => {
    // input
    const articleId = 1;
    const userId = 1;

    // received
    const user = { id: userId, username: 'testuser', password: 'pass123' };
    const article = {
      id: articleId,
      title: 'Title',
      description: 'Desc',
      author: user,
    };

    const updateResult = { affected: 1 };

    // mocking
    (usersService.getUserById as jest.Mock).mockResolvedValue(user);
    (articleRepository.findOne as jest.Mock).mockResolvedValue(article);
    (articleRepository.delete as jest.Mock).mockResolvedValue(updateResult);

    // testing method
    const result = await articleService.delete(articleId, userId);

    expect(result).toEqual(updateResult);

    expect(articleRepository.delete).toHaveBeenCalledWith(articleId);

    expect(redisClient.del).toHaveBeenCalledWith(`article:${articleId}`)
  });

  it('should throw a ForbiddenException if the user is not the author', async () => {
    // input
    const articleId = 1;
    const userId = 2;

    // received
    const user = { id: userId, username: 'testuser', password: 'pass123' };
    const article = {
      id: articleId,
      title: 'Title',
      description: 'Desc',
      author: { id: 1, username: 'anotheruser', password: 'pass444' },
    };

    // mocking
    (usersService.getUserById as jest.Mock).mockResolvedValue(user);
    (articleRepository.findOne as jest.Mock).mockResolvedValue(article);

    // testing method
    await expect(articleService.delete(articleId, userId)).rejects.toThrow(ForbiddenException);

    expect(articleRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw an HttpException if the article does not exist', async () => {
    // input
    const articleId = 999;
    const userId = 1;

    // received
    const user = { id: userId, username: 'testuser', password: 'pass123' };

    // mocking
    (usersService.getUserById as jest.Mock).mockResolvedValue(user);
    (articleRepository.findOne as jest.Mock).mockResolvedValue(null);

    // testing method
    await expect(articleService.delete(articleId, userId)).rejects.toThrow(HttpException);

    expect(articleRepository.delete).not.toHaveBeenCalled();
  });
})