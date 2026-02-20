import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HomeProjectsPreview } from './home-projects-preview';
import { Media } from './media';
import { Admin } from './admin';

@Entity('project')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 255, nullable: true, name: 'repo_url', comment: '代码仓库链接' })
  repoUrl?: string;

  @Column({ length: 255, nullable: true, name: 'website_url', comment: '项目官网链接' })
  websiteUrl?: string;

  @Column({ length: 255, nullable: true, name: 'cover_image', comment: '项目封面图片' })
  coverImage?: string;

  @Column({ length: 20, nullable: true, default: '#f4f4f4', name: 'bg_color', comment: '项目卡片背景色' })
  bgColor?: string;

  @Column({ default: false, name: 'is_featured', comment: '是否在首页展示' })
  isFeatured: boolean;

  @OneToOne(() => HomeProjectsPreview, (preview) => preview.project)
  homePreview?: HomeProjectsPreview;

  @OneToMany(() => Media, (media) => media.project)
  medias?: Media[];

  @ManyToOne(() => Admin, (admin) => admin.projects, { onDelete: 'SET NULL', nullable: true })
  updatedBy?: Admin;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
