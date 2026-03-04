import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { SettingsModule } from './settings/settings.module';
import { User } from './users/user.entity';
import { Project } from './projects/project.entity';
import { DeployLog } from './projects/deploy-log.entity';
import { HaaleSettings } from './settings/haale-settings.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH ?? './haale.db',
      entities: [User, Project, DeployLog, HaaleSettings],
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
    }),
    UsersModule,
    AuthModule,
    ProjectsModule,
    SettingsModule,
  ],
})
export class AppModule {}
