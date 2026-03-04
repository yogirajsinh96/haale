import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';
import { DeployLog } from './deploy-log.entity';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';
import { User } from '../users/user.entity';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(DeployLog)
    private readonly logsRepo: Repository<DeployLog>,
  ) {}

  async findAll(userId: string): Promise<Project[]> {
    return this.projectsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found.');
    if (project.userId !== userId) throw new ForbiddenException();
    return project;
  }

  async create(dto: CreateProjectDto, user: User): Promise<Project> {
    const project = this.projectsRepo.create({
      name: dto.name,
      repoUrl: dto.repoUrl,
      branch: dto.branch ?? 'main',
      port: dto.port,
      status: 'idle',
      userId: user.id,
    });
    return this.projectsRepo.save(project);
  }

  async update(id: string, dto: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.findOne(id, userId);
    Object.assign(project, dto);
    return this.projectsRepo.save(project);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const project = await this.findOne(id, userId);
    await this.projectsRepo.remove(project);
    return { message: `Project "${project.name}" deleted.` };
  }

  async deploy(id: string, userId: string): Promise<{ message: string; deployLogId: string }> {
    const project = await this.findOne(id, userId);
    const log = this.logsRepo.create({ projectId: project.id, status: 'pending', startedAt: new Date().toISOString() });
    await this.logsRepo.save(log);
    await this.projectsRepo.update(project.id, { status: 'building' });
    this.runDeploySimulation(project, log).catch((err) => this.logger.error(`Deploy error for ${project.id}`, err));
    return { message: 'Deploy started.', deployLogId: log.id };
  }

  private async runDeploySimulation(project: Project, log: DeployLog) {
    const lines = [
      `[haale] Starting deploy for ${project.name}`,
      `[haale] Branch: ${project.branch}  Repo: ${project.repoUrl}`,
      '',
      `$ git clone --depth 1 --branch ${project.branch} ${project.repoUrl} ./app`,
      'Cloning into ./app...',
      'Receiving objects: 100% (342/342), 1.23 MiB, done.',
      '',
      '$ npm install && npm run build',
      'added 312 packages in 8.3s',
      '✓ 248 modules transformed.',
      `[haale] Starting on port ${project.port}`,
      `[haale] ✓ ${project.name} is live`,
    ];
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 2000));
    const failed = Math.random() < 0.1;
    if (failed) lines.push('npm ERR! Build failed with exit code 1');
    await this.logsRepo.update(log.id, { status: failed ? 'failed' : 'success', output: lines.join('\n'), exitCode: failed ? 1 : 0, finishedAt: new Date().toISOString() });
    const newStatus: ProjectStatus = failed ? 'failed' : 'running';
    await this.projectsRepo.update(project.id, { status: newStatus, lastDeployedAt: new Date().toISOString() });
  }

  async getLogs(projectId: string, userId: string): Promise<{ logs: string[] }> {
    await this.findOne(projectId, userId);
    const latest = await this.logsRepo.findOne({ where: { projectId }, order: { createdAt: 'DESC' } });
    if (!latest || !latest.output) return { logs: ['No deploy logs yet.'] };
    return { logs: latest.output.split('\n') };
  }
}
