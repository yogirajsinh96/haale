import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';

export type DeployStatus = 'pending' | 'running' | 'success' | 'failed';

@Entity('deploy_logs')
export class DeployLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'pending' })
  status: DeployStatus;

  @Column({ type: 'text', default: '' })
  output: string;

  @Column({ default: -1 })
  exitCode: number;

  @Column({ default: '' })
  startedAt: string;

  @Column({ default: '' })
  finishedAt: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Project, (project) => project.deployLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;
}
