/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import { PROFILE_PACKAGE_NAME } from './shared/dependencies/profile.pb';
import { CamelCaseInterceptor } from './middleware/interceptors/camel-case.interceptor';
import { GrpcLoggerInterceptor } from './middleware/grpc-logger.interceptor';
import { Env } from './config/configuration';

async function bootstrap() {
  const logger = new Logger('ProfileService');

  // Create gRPC microservice
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: PROFILE_PACKAGE_NAME,
        protoPath: join(process.cwd(), 'src/shared/proto/profile.proto'),
        url: `${Env.PROFILE_SERVICE_URL}`,
      },
    },
  );

  // Register the camelCase interceptor globally
  app.useGlobalInterceptors(new CamelCaseInterceptor());
  app.useGlobalInterceptors(new GrpcLoggerInterceptor());

  await app.listen();
  logger.log(
    `Profile Service is listening on ${Env.PROFILE_SERVICE_URL} (gRPC)`,
  );
  logger.log('Profile Service is ready to accept connections');
}

bootstrap();
