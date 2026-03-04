import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HaaleSettings } from './haale-settings.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HaaleSettings])],
  providers: [SettingsService],
  controllers: [SettingsController],
})
export class SettingsModule {}
