import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { News } from './news';

@Entity('news_category')
export class NewsCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, comment: '栏目名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '栏目描述' })
  description?: string;

  @Column({ length: 255, nullable: true, name: 'cover_image', comment: '栏目封面图片' })
  coverImage?: string;

  @Column({ default: 0, comment: '排序顺序，数字越小越靠前' })
  order: number;

  @Column({ default: true, name: 'is_visible', comment: '是否在前台显示' })
  isVisible: boolean;

  @OneToMany(() => News, (news) => news.category)
  news?: News[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
