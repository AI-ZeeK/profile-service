import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AddressService } from './address.service';
import { ADDRESS_PACKAGE_NAME } from 'src/shared/dependencies/address.pb';
import { Env } from 'src/config/configuration';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ADDRESS_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: ADDRESS_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'src/shared/proto/address.proto'),
          url: Env.ADDRESS_SERVICE_URL,
        },
      },
    ]),
  ],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
