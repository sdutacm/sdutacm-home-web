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
 * 操作类型枚举
 */
export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  RESTORE = 'RESTORE',
}

/**
 * 审计日志实体
 * 记录所有管理员的操作
 */
@Entity('audit_log')
@Index(['entityType', 'entityId'])
@Index(['adminId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 操作类型
   */
  @Column({ type: 'enum', enum: AuditActionType, name: 'action_type' })
  actionType: AuditActionType;

  /**
   * 实体类型（如 news, project, media 等）
   */
  @Column({ length: 50, name: 'entity_type' })
  entityType: string;

  /**
   * 实体 ID
   */
  @Column({ nullable: true, name: 'entity_id' })
  entityId?: number;

  /**
   * 实体名称/标题（用于显示）
   */
  @Column({ length: 255, nullable: true, name: 'entity_name' })
  entityName?: string;

  /**
   * 操作描述
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * 变更前的数据（JSON 格式）
   */
  @Column({ type: 'longtext', nullable: true, name: 'old_data' })
  oldData?: string;

  /**
   * 变更后的数据（JSON 格式）
   */
  @Column({ type: 'longtext', nullable: true, name: 'new_data' })
  newData?: string;

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
   * IP 地址
   */
  @Column({ length: 50, nullable: true, name: 'ip_address' })
  ipAddress?: string;

  /**
   * User Agent
   */
  @Column({ length: 500, nullable: true, name: 'user_agent' })
  userAgent?: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
