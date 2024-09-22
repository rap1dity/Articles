import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { CreateUserDto } from "../users/dto/create-user.dto";
import * as bcrypt from "bcryptjs"
import { UsersService } from "../users/users.service";
import { TokensService } from "../tokens/tokens.service";

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService,
              private readonly tokensService: TokensService){}
  async login(dto: CreateUserDto) {
    const user = await this.validateUser(dto);
    return this.tokensService.generateTokens(user);
  }

  async register(dto: CreateUserDto){
    const candidate = await this.usersService.getUserByUsername(dto.username);
    if(candidate)
      throw new HttpException("User already exists", HttpStatus.BAD_REQUEST);

    const hashedPassword = await bcrypt.hash(dto.password, 5);
    const user = await this.usersService.create({...dto, password: hashedPassword})

    return this.tokensService.generateTokens(user)
  }

  async logout(refreshToken: string){
    const payload = this.tokensService.verifyToken(refreshToken);
    return await this.tokensService.removeTokensForDevice(payload.deviceId);
  }

  private async validateUser(dto: CreateUserDto){
    const user = await this.usersService.getUserByUsername(dto.username)
    if(!user)
      throw new UnauthorizedException({message: 'Incorrect username or password'});

    const passwordEquals = await bcrypt.compare(dto.password, user.password);
    if(user && passwordEquals)
      return user;

    throw new UnauthorizedException({message: 'Incorrect username or password'});
  }

  async refreshTokens(refreshToken: string){
    return await this.tokensService.refreshTokens(refreshToken);
  }

}
