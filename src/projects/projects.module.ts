import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { DeployLog } from './deploy-log.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project, DeployLog])],
  providers: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
