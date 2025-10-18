import { Module } from '@nestjs/common';
import { FilesModule } from './files/files.module';
import { AddressModule } from './address/address.module';
import { CommunicationModule } from './communication/communication.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { FinancialsModule } from './financials/financials.module';

@Module({
  imports: [
    FilesModule,
    AddressModule,
    CommunicationModule,
    OrganizationsModule,
    FinancialsModule,
  ],
  exports: [
    FilesModule,
    AddressModule,
    CommunicationModule,
    OrganizationsModule,
    FinancialsModule,
  ],
})
export class SharedModule {}
