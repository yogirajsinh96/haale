import { HaaleSettings } from './haale-settings.entity';

/**
 * Always generates an HTTP-only config.
 * certbot --nginx runs AFTER this and modifies the file itself to add SSL.
 * Never write ssl_certificate paths manually — the cert files don't exist
 * yet when nginx -t runs, which causes the config test to fail.
 */
export function buildNginxConfig(settings: HaaleSettings): string {
  const { serverDomain, wwwRedirect } = settings;
  const upstream = 'http://127.0.0.1:5678';

  const proxyBlock = `    proxy_pass         ${upstream};
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection 'upgrade';
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;`;

  const serverNames = serverDomain + (wwwRedirect ? ' www.' + serverDomain : '');

  // HTTP-only block — certbot will append the SSL server block itself
  return `# haale — generated nginx config
# Domain: ${serverDomain}
# Generated: ${new Date().toISOString()}
# SSL (if enabled) is added by certbot after this file is loaded.

server {
    listen 80;
    listen [::]:80;
    server_name ${serverNames};

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
${proxyBlock}
    }
}
`;
}

export function nginxAvailablePath(domain: string): string {
  return `/etc/nginx/sites-available/haale-${domain}`;
}

export function nginxEnabledPath(domain: string): string {
  return `/etc/nginx/sites-enabled/haale-${domain}`;
}
