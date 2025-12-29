import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Logo } from './logo';

@Entity('global_config')
export class GlobalConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  title: string;

  @Column({ length: 200, nullable: true })
  slogan?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Logo, { nullable: true })
  logo?: Logo;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
