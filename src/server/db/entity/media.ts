import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { Project } from './project';
import { News } from './news';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  path: string;

  @Column({
    type: 'enum',
    enum: MediaTypeEnum,
    default: MediaTypeEnum.IMAGE,
  })
  type: MediaTypeEnum;

  @Column({ length: 255, nullable: true, comment: '描述信息/alt text' })
  alt?: string;

  @Column({ default: true, comment: '是否激活/启用' })
  active: boolean;

  @ManyToOne(() => Project, (project) => project.medias, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  project?: Project;

  @ManyToOne(() => News, (news) => news.medias, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  news?: News;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
