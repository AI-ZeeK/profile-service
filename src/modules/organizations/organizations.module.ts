import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { ORGANIZATION_PACKAGE_NAME } from 'src/shared/dependencies/organization.pb';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ORGANIZATION_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: ORGANIZATION_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'src/shared/proto/organization.proto'),
          url: `${process.env.GRPC_PORT}:${process.env.ORGANIZATION_SERVICE_PORT}`,
        },
      },
    ]),
  ],
  controllers: [],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
