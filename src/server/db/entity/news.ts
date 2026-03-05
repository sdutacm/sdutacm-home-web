import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HomeNewsPreview } from './home-news-preview';
import { Media } from './media';
import { Admin } from './admin';
import { NewsCategory } from './news-category';

@Entity('news')
export class News {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text', comment: '新闻摘要' })
  summary: string;

  @Column({ length: 255, nullable: true, name: 'cover_image', comment: '封面图片路径' })
  coverImage?: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ default: false , name: 'is_published', comment: '是否已发布' })
  isPublished: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'published_at' })
  publishedAt?: Date;

  @Column({ default: 0, name: 'view_count', comment: '浏览次数' })
  viewCount: number;

  @Column({ length: 500, nullable: true, name: 'wx_official_link', comment: '微信公众号链接' })
  wxOfficialLink?: string;

  @OneToOne(() => HomeNewsPreview, (preview) => preview.news)
  homePreview?: HomeNewsPreview;

  @OneToMany(() => Media, (media) => media.news)
  medias?: Media[];

  @ManyToOne(() => Admin, (admin) => admin.news, { onDelete: 'SET NULL', nullable: true })
  updatedBy?: Admin;

  @Column({ name: 'category_id', nullable: true })
  categoryId?: number;

  @ManyToOne(() => NewsCategory, (category) => category.news, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: NewsCategory;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
