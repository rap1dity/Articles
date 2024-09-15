import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from "../users/dto/create-user.dto";
import { HttpException, UnauthorizedException } from "@nestjs/common";

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            getUserByUsername: jest.fn(),
          }
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ]
    }).compile()

    authService = await module.get<AuthService>(AuthService);
    usersService = await module.get<UsersService>(UsersService);
    jwtService = await module.get<JwtService>(JwtService);
  })

  it('should login a user and return a token', async () => {
    // input
    const loginDto: CreateUserDto = { username: 'timeworstseal', password: 'pass123' };

    // received
    const user = { id: 1, username: 'timeworstseal', password: await bcrypt.hash('pass123', 5) };
    const payload = { id: user.id, username: user.username};

    // mocking
    (usersService.getUserByUsername as jest.Mock).mockResolvedValue(user);
    (jwtService.sign as jest.Mock).mockReturnValue('valid_token')

    // testing method
    const result = await authService.login(loginDto);

    expect(result).toEqual({ token: 'valid_token' });

    expect(usersService.getUserByUsername).toHaveBeenCalledWith(loginDto.username);

    expect(jwtService.sign).toHaveBeenCalledWith(payload);
  })

  it('should throw an UnauthorizedException if username is incorrect', async () => {
    // input
    const loginDto = { username: 'nonexistentuser', password: 'pass123' };

    // mocking
    (usersService.getUserByUsername as jest.Mock).mockResolvedValue(null);

    // throwing error
    await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);

    expect(usersService.getUserByUsername).toHaveBeenCalledWith(loginDto.username);
  });

  it('should throw an UnauthorizedException if password is incorrect', async () => {
    // input
    const loginDto = { username: 'testuser', password: 'incorrectpassword' };
    const hashedPassword = 'hashed_password';

    // received
    const user = { id: 1, username: 'testuser', password: hashedPassword };

    // mocking
    (usersService.getUserByUsername as jest.Mock).mockResolvedValue(user);

    // throwing error
    await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);

    expect(usersService.getUserByUsername).toHaveBeenCalledWith(loginDto.username);
  });

  it('should register a user and return a token', async () => {
    // input
    const createUserDto: CreateUserDto = { username: 'testuser', password: 'pass123' };

    // received
    const hashedPassword = await bcrypt.hash(createUserDto.password, 5);
    const user = { id: 1, username: 'testuser', password: hashedPassword};
    const payload = { id: user.id, username: user.username };
    const token = 'generated_token';

    // mocking
    (usersService.getUserByUsername as jest.Mock).mockResolvedValue(null);
    (usersService.create as jest.Mock).mockResolvedValue(user);
    (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue(hashedPassword);
    (jwtService.sign as jest.Mock) = jest.fn().mockReturnValue(token);

    // testing method
    const result = await authService.register(createUserDto);

    expect(result).toEqual({ token });

    expect(usersService.getUserByUsername).toHaveBeenCalledWith(createUserDto.username);

    expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 5);

    expect(usersService.create).toHaveBeenCalledWith({
      username: createUserDto.username,
      password: hashedPassword,
    });

    expect(jwtService.sign).toHaveBeenCalledWith(payload);
  });

  it('should throw an HTTP error if user already exists', async () => {
    // input
    const createUserDto: CreateUserDto = { username: 'testuser', password: 'pass123' };

    // received
    const user = { id: 1, username: 'testuser', password: 'pass123' };

    // mocking
    (usersService.getUserByUsername as jest.Mock).mockResolvedValue(user);

    // throwing error
    await expect(authService.register(createUserDto)).rejects.toThrow(HttpException);

    expect(usersService.getUserByUsername).toHaveBeenCalledWith(createUserDto.username);
  });
})