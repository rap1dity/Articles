import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CreateArticleDto {
  @ApiProperty({example: '10 tips for beginners', description: 'Article title'})
  @IsString({ message: 'must be string' })
  @Length(4,32, { message: 'must be at least 4 characters' })
  readonly title: string;

  @ApiProperty({example: 'tip 1, tip2 etc.', description: 'Article description'})
  @IsString({ message: 'must be string' })
  @Length(1,2048,{ message: 'Article must be less than 2048 characters long, but not empty' })
  readonly description: string;
}