import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({example: '10 tips for beginners', description: 'Article title'})
  @Column()
  title: string;

  @ApiProperty({example: 'tip 1, tip2 etc.', description: 'Article description'})
  @Column()
  description: string;

  @ApiProperty({example: '15.10.2024', description: 'Date of publication'})
  @Column({ type: 'date' })
  published: Date;

  @ManyToOne(() => User, user => user.articles, { onDelete: 'CASCADE'})
  author: User;
}