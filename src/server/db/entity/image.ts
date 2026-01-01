import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Project } from './project';
import { News } from './news';

@Entity('image')
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  path: string;

  @Column({ nullable: true })
  alt?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Project, project => project.images, { onDelete: 'CASCADE', nullable: true })
  project?: Project;

  @ManyToOne(() => News, news => news.images, { onDelete: 'CASCADE', nullable: true })
  news?: News;
}
