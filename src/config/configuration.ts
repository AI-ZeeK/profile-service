import { configDotenv } from 'dotenv';
import { cleanEnv, port, str } from 'envalid';

export default () => ({
  grpc: {
    host: process.env.GRPC_HOST ?? '127.0.0.1',
    port: parseInt(process.env.PROFILE_SERVICE_PORT ?? '50052', 10),
  },
});

configDotenv();

export const Env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'staging', 'production'],
  }),
  JWT_ACCESS_SECRET: str(),
  // JWT_ACCESS_EXPIRY: str(),
  JWT_AUTH_SECRET: str(),
  // JWT_AUTH_EXPIRY: str(),
  JWT_REFRESH_SECRET: str(),
  // JWT_REFRESH_EXPIRY: str(),
  DATABASE_URL: str(),
  REDIS_URL: str({ default: 'redis://localhost:6379' }),
  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: str({ default: '6379' }),
  PROFILE_SERVICE_URL: str(),
  FILES_SERVICE_URL: str(),
  ADDRESS_SERVICE_URL: str(),
  COMMUNICATION_SERVICE_URL: str(),
  ORGANIZATION_SERVICE_URL: str(),
  FINANCIALS_SERVICE_URL: str(),
  ADMIN_SERVICE_URL: str(),
  OPERATIONS_SERVICE_URL: str(),
});

export type AppConfig = typeof Env;

export const appConfig = () => ({ ...Env });
