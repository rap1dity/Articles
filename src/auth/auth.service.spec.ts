import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from "../users/dto/create-user.dto";
import { HttpException, UnauthorizedException } from "@nestjs/common";
import { TokensService } from "../tokens/tokens.service";

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let tokensService: TokensService;

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
         provide: TokensService,
         useValue: {
           generateTokens: jest.fn(),
           verifyToken: jest.fn(),
           removeTokensForDevice: jest.fn(),
           refreshTokens: jest.fn(),
         }
        },
      ]
    }).compile()

    authService = await module.get<AuthService>(AuthService);
    usersService = await module.get<UsersService>(UsersService);
    tokensService = await module.get<TokensService>(TokensService);
  })

  it('should login a user and return a tokens', async () => {
    // input
    const loginDto: CreateUserDto = { username: 'timeworstseal', password: 'pass123' };

    // received
    const user = { id: 1, username: 'timeworstseal', password: await bcrypt.hash('pass123', 5) };
    const tokens = {
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      deviceId: '423423-4242-fdafsd-4333'
    };

    // mocking
    (usersService.getUserByUsername as jest.Mock).mockResolvedValue(user);
    (tokensService.generateTokens as jest.Mock).mockResolvedValue(tokens);

    // testing method
    const result = await authService.login(loginDto);

    expect(result).toEqual(tokens);

    expect(usersService.getUserByUsername).toHaveBeenCalledWith(loginDto.username)

    expect(tokensService.generateTokens).toHaveBeenCalledWith(user);
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
    const tokens = {
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      deviceId: '423423-4242-fdafsd-4333'
    };

    // mocking
    (usersService.getUserByUsername as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue(hashedPassword);
    (usersService.create as jest.Mock).mockResolvedValue(user);
    (tokensService.generateTokens as jest.Mock).mockResolvedValue(tokens);

    // testing method
    const result = await authService.register(createUserDto);

    expect(result).toEqual(tokens);

    expect(usersService.getUserByUsername).toHaveBeenCalledWith(createUserDto.username);

    expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 5);

    expect(usersService.create).toHaveBeenCalledWith({
      username: createUserDto.username,
      password: hashedPassword,
    });

    expect(tokensService.generateTokens).toHaveBeenCalledWith(user);
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

  it('should logout from account', async () => {
    // input
    const refreshToken = 'refresh_token';

    // received
    const payload = {
      deviceId: '423423-4242-fdafsd-4333',
    };

    // mocking
    (tokensService.verifyToken as jest.Mock).mockReturnValue(payload);
    (tokensService.removeTokensForDevice as jest.Mock).mockResolvedValue(null);

    // testing method
    const result = await authService.logout(refreshToken);

    expect(result).toEqual(null);

    expect(tokensService.verifyToken).toHaveBeenCalledWith(refreshToken);

    expect(tokensService.removeTokensForDevice).toHaveBeenCalledWith(payload.deviceId);
  })

  it('should throw throw UnauthorizedException if refreshToken not provided', async () => {
    
  })
})