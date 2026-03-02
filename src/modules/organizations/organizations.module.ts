import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { ORGANIZATION_PACKAGE_NAME } from 'src/shared/dependencies/organization.pb';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Env } from 'src/config/configuration';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ORGANIZATION_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: ORGANIZATION_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'src/shared/proto/organization.proto'),
          url: Env.ORGANIZATION_SERVICE_URL,
        },
      },
    ]),
  ],
  controllers: [],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
