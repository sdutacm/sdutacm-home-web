import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Unique } from 'typeorm';
import { Project } from './project';

@Entity('home_projects_preview')
@Unique(['project'])
export class HomeProjectsPreview {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Project, (project) => project.homePreview, { onDelete: 'CASCADE' })
  @JoinColumn()
  project: Project;

  @Column()
  position: number;

  @Column({ length: 255, nullable: true, name: 'cover_image', comment: '封面图片' })
  coverImage?: string;

  @Column({ default: true })
  visible: boolean;
}
