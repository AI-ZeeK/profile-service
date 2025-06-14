import { Module } from '@nestjs/common';
import { FilesModule } from './files/files.module';
import { AddressModule } from './address/address.module';
import { CommunicationModule } from './communication/communication.module';
import { OrganizationsModule } from './organizations/organizations.module';

@Module({
  imports: [
    FilesModule,
    AddressModule,
    CommunicationModule,
    OrganizationsModule,
  ],
  exports: [
    FilesModule,
    AddressModule,
    CommunicationModule,
    OrganizationsModule,
  ],
})
export class SharedModule {}
