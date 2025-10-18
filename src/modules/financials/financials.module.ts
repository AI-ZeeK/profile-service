import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { FINANCIALS_PACKAGE_NAME } from 'src/shared/dependencies/financials.pb';
import { FinancialsService } from './financials.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: FINANCIALS_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: FINANCIALS_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'src/shared/proto/financials.proto'),
          url:
            process.env.FINANCIALS_SERVICE_URL ||
            `0.0.0.0:${process.env.FINANCIALS_SERVICE_PORT}`,
        },
      },
    ]),
  ],
  controllers: [],
  providers: [FinancialsService],
  exports: [FinancialsService],
})
export class FinancialsModule {}
