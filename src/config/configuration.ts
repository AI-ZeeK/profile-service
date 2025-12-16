import { configDotenv } from 'dotenv';
import { bool, cleanEnv, port, str } from 'envalid';
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
  PORT: port({ default: 8000 }),
  JWT_ACCESS_SECRET: str(),
  // JWT_ACCESS_EXPIRY: str(),
  JWT_AUTH_SECRET: str(),
  // JWT_AUTH_EXPIRY: str(),
  JWT_REFRESH_SECRET: str(),
  // JWT_REFRESH_EXPIRY: str(),
  DATABASE_URL: str(),
  PROFILE_SERVICE_PORT: port(),
  FILES_SERVICE_PORT: str(),
  ADDRESS_SERVICE_PORT: str(),
  COMMUNICATION_SERVICE_PORT: str(),
  ORGANIZATION_SERVICE_PORT: str(),
  FINANCIAL_SERVICE_PORT: str(),
  ADMIN_SERVICE_PORT: str(),
  FINANCIALS_SERVICE_URL: str(),
  OPERATIONS_SERVICE_URL: str(),
  GRPC_HOST: str(),
});

export type AppConfig = typeof Env;

export const appConfig = () => ({ ...Env });
