import {
  Injectable, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { HaaleSettings } from './haale-settings.entity';
import { UpdateHaaleSettingsDto } from './settings.dto';
import { buildNginxConfig, nginxAvailablePath, nginxEnabledPath } from './nginx.helper';

const execAsync = promisify(exec);

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(HaaleSettings)
    private readonly repo: Repository<HaaleSettings>,
  ) {}

  async get(): Promise<HaaleSettings> {
    let s = await this.repo.findOne({ where: { id: 'singleton' } });
    if (!s) {
      s = this.repo.create({ id: 'singleton', publicIp: this.detectIp() });
      await this.repo.save(s);
    }
    return s;
  }

  async update(dto: UpdateHaaleSettingsDto): Promise<HaaleSettings> {
    let s = await this.get();
    if (dto.serverDomain !== undefined) s.serverDomain = dto.serverDomain;
    if (dto.isSubdomain  !== undefined) s.isSubdomain  = dto.isSubdomain;
    if (dto.publicIp     !== undefined) s.publicIp     = dto.publicIp;
    if (dto.httpsEnabled !== undefined) s.httpsEnabled = dto.httpsEnabled;
    if (dto.certEmail    !== undefined) s.certEmail    = dto.certEmail;
    if (dto.forceHttps   !== undefined) s.forceHttps   = dto.forceHttps;
    if (dto.wwwRedirect  !== undefined) s.wwwRedirect  = dto.wwwRedirect;
    return this.repo.save(s);
  }

  async provision(dryRun = false): Promise<HaaleSettings> {
    const s = await this.get();
    if (!s.serverDomain) throw new BadRequestException('Set a server domain before provisioning.');
    if (s.httpsEnabled && !s.certEmail) throw new BadRequestException('An email is required when HTTPS is enabled.');
    s.provisionStatus = 'running';
    s.provisionLog = '';
    await this.repo.save(s);
    this.runProvision(s, dryRun).catch((err) => this.logger.error('Provisioning error', err));
    return s;
  }

  private async runProvision(settings: HaaleSettings, dryRun: boolean) {
    const log: string[] = [];
    const p = (line: string) => { log.push(line); this.logger.log('[provision] ' + line); };
    const flush = async (status?: string) => {
      await this.repo.update('singleton', {
        provisionLog: log.join('\n'),
        ...(status ? { provisionStatus: status } : {}),
      });
    };

    try {
      p('====================================================');
      p('  haale domain provisioning');
      p('  domain   : ' + settings.serverDomain);
      p('  subdomain: ' + (settings.isSubdomain ? 'yes' : 'no (apex)'));
      p('  https    : ' + (settings.httpsEnabled ? 'yes' : 'no'));
      p('  dry run  : ' + (dryRun ? 'YES' : 'no'));
      p('====================================================');
      p('');

      // Step 1: nginx
      p('[ 1/5 ] Checking nginx...');
      const nginxInstalled = this.cmdExists('nginx');
      if (nginxInstalled) {
        p('        nginx already installed');
        await this.repo.update('singleton', { nginxState: 1 });
      } else {
        p('        nginx not found');
        if (!dryRun) {
          await this.exec('apt-get update -qq', p);
          await this.exec('apt-get install -y nginx', p);
          await this.exec('systemctl enable nginx && systemctl start nginx', p);
          p('        nginx installed');
          await this.repo.update('singleton', { nginxState: 2 });
        } else {
          p('        [dry-run] would install nginx');
        }
      }
      await flush();

      // Step 2: write config
      p('');
      p('[ 2/5 ] Writing nginx config...');
      const configContent = buildNginxConfig(settings);
      const configPath = nginxAvailablePath(settings.serverDomain);
      const enabledPath = nginxEnabledPath(settings.serverDomain);
      p('        config: ' + configPath);

      if (!dryRun) {
        fs.mkdirSync('/etc/nginx/sites-available', { recursive: true });
        fs.mkdirSync('/etc/nginx/sites-enabled', { recursive: true });
        fs.mkdirSync('/var/www/certbot', { recursive: true });
        fs.writeFileSync(configPath, configContent, 'utf8');
        p('        config written');
        if (fs.existsSync(enabledPath)) fs.unlinkSync(enabledPath);
        fs.symlinkSync(configPath, enabledPath);
        p('        symlink created');
        await this.exec('nginx -t', p);
        await this.exec('systemctl reload nginx', p);
        p('        nginx reloaded');
        await this.repo.update('singleton', { nginxConfigPath: configPath });
      } else {
        p('        [dry-run] would write config and reload nginx');
      }
      await flush();

      // Step 3: certbot
      if (settings.httpsEnabled) {
        p('');
        p("[ 3/5 ] Setting up HTTPS with Let's Encrypt...");
        const certbotOk = this.cmdExists('certbot');
        if (!certbotOk) {
          if (!dryRun) {
            await this.exec('apt-get install -y certbot python3-certbot-nginx', p);
            p('        certbot installed');
          } else {
            p('        [dry-run] would install certbot');
          }
        } else {
          p('        certbot already installed');
        }
        const domainFlags = settings.wwwRedirect
          ? '-d ' + settings.serverDomain + ' -d www.' + settings.serverDomain
          : '-d ' + settings.serverDomain;
        const certCmd = 'certbot --nginx --non-interactive --agree-tos --email ' +
          settings.certEmail + ' ' + domainFlags +
          (settings.forceHttps ? ' --redirect' : ' --no-redirect');
        p('        $ ' + certCmd);
        if (!dryRun) {
          await this.exec(certCmd, p);
          p('        certificate obtained');
        } else {
          p('        [dry-run] would obtain certificate');
        }

        p('');
        p('[ 4/5 ] Enabling auto-renewal...');
        if (!dryRun) {
          await this.exec('systemctl enable certbot.timer || true', p);
          p('        certbot.timer enabled (auto-renews every 60 days)');
        } else {
          p('        [dry-run] would enable certbot.timer');
        }
      } else {
        p('');
        p('[ 3/5 ] HTTPS not requested — skipping certbot');
        p('[ 4/5 ] skipped');
      }
      await flush();

      p('');
      p('[ 5/5 ] Final nginx reload...');
      if (!dryRun) {
        await this.exec('nginx -t && systemctl reload nginx', p);
        p('        nginx reloaded');
      } else {
        p('        [dry-run] would reload nginx');
      }

      p('');
      p('====================================================');
      p('  ' + (dryRun ? 'Dry run complete' : 'Domain is live!'));
      p('  ' + (settings.httpsEnabled ? 'https' : 'http') + '://' + settings.serverDomain);
      p('====================================================');

      await this.repo.update('singleton', {
        provisionStatus: 'done',
        lastProvisionedAt: new Date().toISOString(),
      });
      await flush('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      p('');
      p('PROVISIONING FAILED: ' + msg);
      await flush('failed');
    }
  }

  private cmdExists(cmd: string): boolean {
    try { execSync('which ' + cmd, { stdio: 'ignore' }); return true; } catch { return false; }
  }

  private async exec(cmd: string, push: (l: string) => void): Promise<void> {
    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout: 120000 });
      const out = (stdout + stderr).trim();
      if (out) out.split('\n').forEach((l) => push('        ' + l));
    } catch (err: unknown) {
      const e = err as { stderr?: string; stdout?: string; message?: string };
      const out = ((e.stderr ?? '') + (e.stdout ?? '')).trim();
      if (out) out.split('\n').forEach((l) => push('        ' + l));
      throw new Error('Command failed: ' + cmd);
    }
  }

  private detectIp(): string {
    const cmds = [
      'curl -s --max-time 3 https://api.ipify.org',
      'curl -s --max-time 3 https://icanhazip.com',
      "hostname -I | awk '{print $1}'",
    ];
    for (const cmd of cmds) {
      try {
        const ip = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim().split('\n')[0];
        if (ip && /\d+\.\d+\.\d+\.\d+/.test(ip)) return ip;
      } catch { /* try next */ }
    }
    return '';
  }
}
