import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { User } from "../users/entities/user.entity";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs"
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService,
              private readonly jwtService: JwtService){}
  async login(dto: CreateUserDto) {
    const user = await this.validateUser(dto);
    return this.generateToken(user);
  }

  async register(dto: CreateUserDto){
    const candidate = await this.usersService.getUserByUsername(dto.username);
    if(candidate)
      throw new HttpException("User already exists", HttpStatus.BAD_REQUEST);

    const hashedPassword = await bcrypt.hash(dto.password, 5);
    const user = await this.usersService.create({...dto, password: hashedPassword})

    return this.generateToken(user)
  }

  private async generateToken(user: User){
    const payload = {id: user.id, username: user.username}

    return {
      token: this.jwtService.sign(payload)
    }
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
}
