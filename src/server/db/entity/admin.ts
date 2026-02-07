import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AdminRoleEnum } from '@common/enums/admin-role';
import { Media } from './media';

@Entity('admin')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'enum', enum: AdminRoleEnum, default: AdminRoleEnum.ADMIN })
  role: AdminRoleEnum;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Media, (media) => media.uploadedBy)
  medias: Media[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
