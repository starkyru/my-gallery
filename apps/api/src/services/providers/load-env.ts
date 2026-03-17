import { config } from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

export function loadProviderEnv(dir: string): Record<string, string> {
  const envPath = join(dir, '.env');
  if (!existsSync(envPath)) return {};
  const result = config({ path: envPath });
  return (result.parsed as Record<string, string>) || {};
}
