import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../users/entities/user.entity";

@Entity('tokens')
export class Token {
  @ApiProperty({ example: 'token', description: 'refresh token'})
  @PrimaryColumn()
  jti: string;

  @ManyToOne(() => User, user => user.tokens, { onDelete: 'CASCADE'})
  user: User;

  @ApiProperty({ example: '45f5a00e-28fd-4cd5-975e-b241a68e4a7c', description: 'user device name'})
  @PrimaryColumn()
  deviceId: string;

  @ApiProperty({example: false, description: 'token revoke status'})
  @Column({ default: false })
  revoked: boolean;

  @ApiProperty({ example: '21.05.2034 14:30:10', description: 'token expiration date'})
  @Column()
  expiresAt: Date;
}