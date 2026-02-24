import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Admin } from './admin';

/**
 * 数据版本历史实体
 * 存储实体的完整历史版本，支持回溯到任意时间点
 */
@Entity('data_version')
@Index(['entityType', 'entityId', 'version'])
@Index(['entityType', 'entityId', 'createdAt'])
export class DataVersion {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 实体类型（如 news, project, media, global_config 等）
   */
  @Column({ length: 50, name: 'entity_type' })
  entityType: string;

  /**
   * 实体 ID
   */
  @Column({ name: 'entity_id' })
  entityId: number;

  /**
   * 版本号（从 1 开始递增）
   */
  @Column()
  version: number;

  /**
   * 快照数据（完整的实体数据 JSON）
   */
  @Column({ type: 'longtext', name: 'snapshot_data' })
  snapshotData: string;

  /**
   * 变更摘要
   */
  @Column({ length: 500, nullable: true, name: 'change_summary' })
  changeSummary?: string;

  /**
   * 操作管理员 ID
   */
  @Column({ name: 'admin_id' })
  adminId: number;

  /**
   * 操作管理员
   */
  @ManyToOne(() => Admin, { onDelete: 'SET NULL', nullable: true })
  admin?: Admin;

  /**
   * 是否为当前版本
   */
  @Column({ default: true, name: 'is_current' })
  isCurrent: boolean;

  /**
   * 是否已删除（软删除的版本）
   */
  @Column({ default: false, name: 'is_deleted' })
  isDeleted: boolean;

  /**
   * 创建时间
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
