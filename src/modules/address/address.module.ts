import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AddressService } from './address.service';
import { ADDRESS_PACKAGE_NAME } from 'src/shared/dependencies/address.pb';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ADDRESS_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: ADDRESS_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'src/shared/proto/address.proto'),
          url:
            process.env.ADDRESS_SERVICE_URL ||
            `0.0.0.0:${process.env.ADDRESS_SERVICE_PORT}`,
        },
      },
    ]),
  ],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
