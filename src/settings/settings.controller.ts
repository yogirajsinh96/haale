import {
  Controller, Get, Put, Post, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateHaaleSettingsDto, ProvisionDomainDto } from './settings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /** GET /settings — get haale server settings */
  @Get()
  get() {
    return this.settingsService.get();
  }

  /** PUT /settings — update server domain, HTTPS, IP etc. */
  @Put()
  update(@Body() dto: UpdateHaaleSettingsDto) {
    return this.settingsService.update(dto);
  }

  /**
   * POST /settings/provision
   * Trigger nginx + certbot provisioning for the configured domain.
   * Runs in background; poll GET /settings to watch provisionLog + provisionStatus.
   */
  @Post('provision')
  @HttpCode(HttpStatus.ACCEPTED)
  provision(@Body() dto: ProvisionDomainDto) {
    return this.settingsService.provision(dto.dryRun ?? false);
  }
}
