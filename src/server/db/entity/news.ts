import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HomeNewsPreview } from './home-news-preview';
import { Media } from './media';

@Entity('news')
export class News {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '新闻摘要' })
  summary?: string;

  @Column({ length: 255, nullable: true, name: 'cover_image', comment: '封面图片路径' })
  coverImage?: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ default: false , name: 'is_published', comment: '是否已发布' })
  isPublished: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'published_at' })
  publishedAt?: Date;

  @OneToOne(() => HomeNewsPreview, (preview) => preview.news)
  homePreview?: HomeNewsPreview;

  @OneToMany(() => Media, (media) => media.news)
  medias?: Media[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
