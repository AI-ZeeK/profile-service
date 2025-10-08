import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { COMMUNICATION_PACKAGE_NAME } from 'src/shared/dependencies/communication.pb';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: COMMUNICATION_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: COMMUNICATION_PACKAGE_NAME,
          protoPath: join(
            process.cwd(),
            'src/shared/proto/communication.proto',
          ),
          url:
            process.env.COMMUNICATION_SERVICE_URL ||
            `0.0.0.0:${process.env.COMMUNICATION_SERVICE_PORT}`,
        },
      },
    ]),
  ],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
