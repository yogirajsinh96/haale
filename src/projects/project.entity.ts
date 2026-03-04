import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { DeployLog } from './deploy-log.entity';

export type ProjectStatus = 'idle' | 'building' | 'running' | 'failed';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 128 })
  name: string;

  @Column({ length: 512 })
  repoUrl: string;

  @Column({ default: 'main', length: 128 })
  branch: string;

  @Column({ type: 'int' })
  port: number;

  @Column({ default: 'idle' })
  status: ProjectStatus;

  @Column({ default: '' })
  lastDeployedAt: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => DeployLog, (log) => log.project, { cascade: true })
  deployLogs: DeployLog[];
}
