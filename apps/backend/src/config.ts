import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}
if (isProd && !process.env.TOKEN_ENCRYPTION_KEY) {
  throw new Error('TOKEN_ENCRYPTION_KEY must be set in production');
}

const port = Number(process.env.PORT) || 5000;

export const config = {
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  /** Where the React app lives (CORS + OAuth redirects back to the UI). */
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  /** Public URL of this API (used to build OAuth callback URLs). */
  apiPublicUrl: (process.env.API_PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, ''),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: '7d' as const,
  /** 32-byte key (base64 or hex) for encrypting OAuth tokens at rest. */
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY || '',
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
};

export const isGithubConfigured = () => !!(config.github.clientId && config.github.clientSecret);
export const isGoogleConfigured = () => !!(config.google.clientId && config.google.clientSecret);
