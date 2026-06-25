import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid PostgreSQL connection URL' }),

  // Redis
  REDIS_URL: z.string().url({ message: 'REDIS_URL must be a valid Redis connection URL' }),

  // Auth
  NEXTAUTH_SECRET: z.string().min(32, { message: 'NEXTAUTH_SECRET must be at least 32 characters' }),

  // AI
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-', { message: 'ANTHROPIC_API_KEY must start with sk-ant-' }),

  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Validate and export — process exits with a clear error if any var is missing
function validateEnv() {
  const result = envSchema.safeParse(process.env);

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
