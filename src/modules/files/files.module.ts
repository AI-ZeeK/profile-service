import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { FilesService } from './files.service';
import {
  FILES_PACKAGE_NAME,
  protobufPackage,
} from 'src/shared/dependencies/files.pb';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: FILES_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: FILES_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'src/shared/proto/files.proto'),
          url: `${process.env.GRPC_PORT}:${process.env.FILES_SERVICE_PORT}`,
        },
      },
    ]),
  ],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
