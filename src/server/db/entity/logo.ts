import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('logo')
export class Logo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  path: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
