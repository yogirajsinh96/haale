import { homedir } from 'os';
import { join } from 'path';
import * as fs from 'fs';

/**
 * All haale data lives under ~/.haale/
 * This is created automatically on first run.
 *
 * ~/.haale/
 *   haale.db          — SQLite database
 *   projects/         — deployed project workspaces
 *     <project-name>/
 *       repo/         — cloned git repo
 *       node_modules/
 *       public/       — built output
 *   logs/             — deploy logs
 *   public/           — haale UI static files (frontend build)
 */

export const HAALE_HOME = process.env.HAALE_HOME ?? join(homedir(), '.haale');

export const PATHS = {
  home:     HAALE_HOME,
  db:       join(HAALE_HOME, 'haale.db'),
  projects: join(HAALE_HOME, 'projects'),
  logs:     join(HAALE_HOME, 'logs'),
  public:   join(HAALE_HOME, 'public'),
};

/** Call once at startup — creates all required directories */
export function ensureHaaleHome(): void {
  for (const dir of [
    PATHS.home,
    PATHS.projects,
    PATHS.logs,
    PATHS.public,
  ]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/** Returns the workspace directory for a given project name */
export function projectWorkspace(projectName: string): string {
  return join(PATHS.projects, projectName);
}
