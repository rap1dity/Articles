import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Like, Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User)
              private readonly usersRepository: Repository<User>) {}

  async create(dto: CreateUserDto) {
    const candidate = await this.usersRepository.findOne({where: {username: dto.username}});
    if(candidate)
      throw new HttpException("User already exists", HttpStatus.BAD_REQUEST);

    const user = await this.usersRepository.create(dto);
    return await this.usersRepository.save(user);
  }

  async getUsersByUsername(username: string){
    return await this.usersRepository.findOne({where: { username: Like(`%${username}%`)}})
  }

  async getUserById(userId: number){
    const user = await this.usersRepository.findOne({where: {id: userId}})
    if(!user)
      throw new HttpException(`User with id ${userId} not found`, HttpStatus.BAD_REQUEST);

    return user;
  }

  async getUserByUsername(username: string){
    return await this.usersRepository.findOne({where: {username}})
  }
}
