import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: 'timeworstseal', description: 'Username'})
  @IsString({ message: 'must be string' })
  @Length(4,32, { message: 'must be at least 4 characters' })
  readonly username: string;

  @ApiProperty({example: 'pass123', description: 'Password'})
  @IsString({ message: 'must be string' })
  @Length(4,16, { message: 'must be 4-16 characters long' })
  readonly password: string;
}