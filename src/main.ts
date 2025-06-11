/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import { PROFILE_PACKAGE_NAME } from './shared/dependencies/profile.pb';

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
        url: `${process.env.GRPC_HOST}:${process.env.PROFILE_SERVICE_PORT}`,
        keepalive: {
          keepaliveTimeMs: 5000,
          keepalivePermitWithoutCalls: 0,
        },
        maxReceiveMessageLength: 4 * 1024 * 1024, // 4MB
        maxSendMessageLength: 4 * 1024 * 1024, // 4MB
      },
    },
  );

  await app.listen();
  logger.log(
    `Profile Service is listening on ${process.env.GRPC_HOST}:${process.env.PROFILE_SERVICE_PORT}`,
  );
  logger.log('Profile Service is ready to accept connections');
}

bootstrap();
