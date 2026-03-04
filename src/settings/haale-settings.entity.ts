import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Singleton row — always id = 'singleton'.
 * Stores haale server-level configuration.
 * No nullable columns — empty string means "not set".
 */
@Entity('haale_settings')
export class HaaleSettings {
  @PrimaryColumn()
  id: string;

  // ─── Domain / nginx ───────────────────────────────────────────────────────

  /**
   * The domain (or subdomain) mapped to this haale server.
   * e.g. "haale.mycompany.com"  or  "192.168.1.10"
   * Empty string = not configured.
   */
  @Column({ default: '' })
  serverDomain: string;

  /**
   * Whether this is a subdomain (true) or apex domain (false).
   * Only meaningful when serverDomain is set.
   */
  @Column({ default: false })
  isSubdomain: boolean;

  /**
   * Detected or manually entered public IPv4 of this server.
   * Shown to users as the DNS A record target.
   */
  @Column({ default: '' })
  publicIp: string;

  // ─── HTTPS / certbot ─────────────────────────────────────────────────────

  /**
   * Whether HTTPS should be enabled for the haale server domain.
   */
  @Column({ default: false })
  httpsEnabled: boolean;

  /**
   * Email used for Let's Encrypt registration.
   */
  @Column({ default: '' })
  certEmail: string;

  /**
   * Redirect all HTTP to HTTPS.
   */
  @Column({ default: true })
  forceHttps: boolean;

  /**
   * Add www → apex redirect (only for apex domains).
   */
  @Column({ default: false })
  wwwRedirect: boolean;

  // ─── nginx state ─────────────────────────────────────────────────────────

  /**
   * Whether nginx was detected as pre-installed before we ran setup.
   * 0 = not checked, 1 = was installed, 2 = we installed it.
   */
  @Column({ default: 0 })
  nginxState: number;

  /** Path of the generated nginx config file, or empty if not generated. */
  @Column({ default: '' })
  nginxConfigPath: string;

  // ─── Provisioning ─────────────────────────────────────────────────────────

  /** Current provisioning status */
  @Column({ default: 'idle' })
  provisionStatus: string;   // 'idle' | 'running' | 'done' | 'failed'

  /** Full provisioning log output */
  @Column({ type: 'text', default: '' })
  provisionLog: string;

  /** ISO string of when last provisioning ran */
  @Column({ default: '' })
  lastProvisionedAt: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
