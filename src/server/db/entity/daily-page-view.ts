import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('daily_page_view')
@Index(['pageKey', 'date'], { unique: true })
export class DailyPageView {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, name: 'page_key', comment: '页面标识符，如 home' })
  pageKey: string;

  @Column({ type: 'date', comment: '日期' })
  date: string;

  @Column({ default: 0, name: 'view_count', comment: '当日访问次数' })
  viewCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
