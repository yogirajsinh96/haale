import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Project } from '../projects/project.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 64 })
  username: string;

  @Column()
  @Exclude()   // never serialise password hash in responses
  password: string;

  @Column({ default: 'user' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Project, (project) => project.user, { lazy: true })
  projects: Promise<Project[]>;
}
