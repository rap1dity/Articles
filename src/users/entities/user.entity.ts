import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Article } from "../../article/entities/article.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({example: 'timeworstseal', description: 'Username'})
  @Column()
  username: string;

  @ApiProperty({example: 'pass123', description: 'Password'})
  @Column()
  password: string;

  @OneToMany(() => Article, article => article.author)
  articles: Article[];
}