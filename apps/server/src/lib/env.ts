import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

function loadEnvFiles() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const serverRoot = path.resolve(currentDir, '../..');
  const repoRoot = path.resolve(serverRoot, '../..');

  const envFiles = [path.join(repoRoot, '.env'), path.join(serverRoot, '.env')];

  for (const envFile of envFiles) {
    if (!fs.existsSync(envFile)) continue;

    const contents = fs.readFileSync(envFile, 'utf8');
    const lines = contents.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFiles();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid PostgreSQL connection URL' }),

  // Redis
  REDIS_URL: z.string().url({ message: 'REDIS_URL must be a valid Redis connection URL' }),

  // Auth
  NEXTAUTH_SECRET: z.string().min(32, { message: 'NEXTAUTH_SECRET must be at least 32 characters' }),

  // AI
  AI_PROVIDER: z.enum(['anthropic', 'openrouter']).default('anthropic'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional().default('openai/gpt-4o-mini'),

  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
}).superRefine((data, ctx) => {
  if (data.AI_PROVIDER === 'anthropic') {
    if (!data.ANTHROPIC_API_KEY || !data.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ANTHROPIC_API_KEY'],
        message: 'ANTHROPIC_API_KEY is required and must start with sk-ant- when AI_PROVIDER is anthropic',
      });
    }
  }

  if (data.AI_PROVIDER === 'openrouter') {
    if (!data.OPENROUTER_API_KEY || data.OPENROUTER_API_KEY.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OPENROUTER_API_KEY'],
        message: 'OPENROUTER_API_KEY is required and must be a non-empty OpenRouter key when AI_PROVIDER is openrouter',
      });
    }
  }
});

// Validate and export — process exits with a clear error if any var is missing
function validateEnv() {
  const normalizedEnv = {
    ...process.env,
    AI_PROVIDER: process.env.AI_PROVIDER ?? (process.env.OPENROUTER_API_KEY ? 'openrouter' : 'anthropic'),
  };

  const result = envSchema.safeParse(normalizedEnv);

  if (!result.success) {
    console.error('❌ Invalid environment variables detected:\n');
    result.error.issues.forEach((issue) => {
      console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    });
    console.error('\nCheck your .env file against .env.example and try again.');
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
