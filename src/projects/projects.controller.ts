import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.projectsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.projectsService.findOne(id, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: User) {
    return this.projectsService.create(dto, user);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto, @CurrentUser() user: User) {
    return this.projectsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.projectsService.remove(id, user.id);
  }

  @Post(':id/deploy')
  @HttpCode(HttpStatus.ACCEPTED)
  deploy(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.projectsService.deploy(id, user.id);
  }

  @Get(':id/logs')
  getLogs(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.projectsService.getLogs(id, user.id);
  }
}
