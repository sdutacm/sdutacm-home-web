import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { News } from './news';

@Entity('home_news_preview')
@Unique(['news'])
export class HomeNewsPreview {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => News, news => news.homePreview, { onDelete: 'CASCADE' })
  @JoinColumn()
  news: News;

  @Column({ length: 255, nullable: true, name: 'cover_image', comment: '封面图片' })
  previewImage?: string;

  @Column({ default: true })
  visible: boolean;
}
