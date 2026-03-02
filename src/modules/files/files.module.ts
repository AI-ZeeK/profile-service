import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { FilesService } from './files.service';
import { FILES_PACKAGE_NAME } from 'src/shared/dependencies/files.pb';
import { Env } from 'src/config/configuration';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: FILES_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: FILES_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'src/shared/proto/files.proto'),
          url: Env.FILES_SERVICE_URL,
        },
      },
    ]),
  ],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
