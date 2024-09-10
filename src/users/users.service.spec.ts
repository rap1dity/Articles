import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from "./entities/user.entity";
import { Like, Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { HttpException } from "@nestjs/common";

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const USER_REPOSITORY_TOKEN = getRepositoryToken(User);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        }
      ],
    }).compile();

    service = await module.get<UsersService>(UsersService);
    userRepository = await module.get<Repository<User>>(USER_REPOSITORY_TOKEN);
  });

  it('should create a user', async() => {
    // input
    const createUserDto: CreateUserDto = { username: 'timeworstseal', password : 'pass123'};

    // received
    const user = { id: 1, username: 'timeworstseal', password: 'pass123' };

    // mocking
    (userRepository.findOne as jest.Mock).mockResolvedValue(null);
    (userRepository.create as jest.Mock).mockReturnValue(createUserDto);
    (userRepository.save as jest.Mock).mockReturnValue(user);

    // testing method
    const result = await service.create(createUserDto);

    expect(result).toEqual(user);

    expect(userRepository.create).toHaveBeenCalledWith(createUserDto)
  });

  it('should throw an HttpException if the user exists', async() => {
    // input
    const createUserDto: CreateUserDto = { username: 'timeworstseal', password : 'pass123'};

    // received
    const user = { id: 1, username: 'timeworstseal', password: 'pass123' };

    // mocking
    (userRepository.findOne as jest.Mock).mockResolvedValue(user);

    // testing method
    await expect(service.create(createUserDto)).rejects.toThrow(HttpException);

    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('should return filtered users', async () => {
    // input
    const username = 't'

    // received
    const users = [
      {id: 1, username: 'timeworstseal', password: 'pass123'},
      {id: 3, username: 'tmk', password: 'pass123'},
    ];

    // mocking
    (userRepository.findOne as jest.Mock).mockResolvedValue(users);

    // testing method
    const result = await service.getUsersByUsername(username)

    expect(result).toEqual(users);

    expect(userRepository.findOne).toHaveBeenCalledWith({where: { username: Like(`%${username}%`)}});
  })


  it('should return user by id', async () => {
    // input
    const id = 1;

    // received
    const user = {id: 1, username: 'timeworstseal', password: 'pass123'};

    // mocking
    (userRepository.findOne as jest.Mock).mockResolvedValue(user);

    // testing method
    const result = await service.getUserById(id);

    expect(result).toEqual(user);

    expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id }});
  })

  it('should throw an HttpException if the user does not exists', async () => {
    // input
    const id = 1;

    // mocking
    (userRepository.findOne as jest.Mock).mockResolvedValue(null);

    // testing method
    await expect(service.getUserById(id)).rejects.toThrow(HttpException);
  })

  it('should return user by username', async () => {
    // input
    const username = 'timeworstseal';

    // received
    const user = {id: 1, username: 'timeworstseal', password: 'pass123'};

    // mocking
    (userRepository.findOne as jest.Mock).mockResolvedValue(user);

    // testing method
    const result = await service.getUserByUsername(username);

    expect(result).toEqual(user);

    expect(userRepository.findOne).toHaveBeenCalledWith({ where: { username }});
  })
});
