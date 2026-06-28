const DEV_JWT_SECRET = 'dev-only-jwt-secret-not-for-production';
const DEV_REFRESH_SECRET = 'dev-only-refresh-secret-not-for-production';

function requireProductionSecret(name: string, value: string | undefined): string {
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} environment variable is required in production`);
  }
  console.warn(`⚠️  ${name} not set — using development fallback`);
  return name === 'JWT_SECRET' ? DEV_JWT_SECRET : DEV_REFRESH_SECRET;
}

export function getJwtSecret(): string {
  return requireProductionSecret('JWT_SECRET', process.env.JWT_SECRET);
}

export function getJwtRefreshSecret(): string {
  return requireProductionSecret('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET);
}

export function assertSecretsAtStartup(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || !refreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET are required in production');
  }

  if (jwtSecret.length < 32 || refreshSecret.length < 32) {
    console.warn('⚠️  JWT secrets should be at least 32 characters for production');
  }
}
