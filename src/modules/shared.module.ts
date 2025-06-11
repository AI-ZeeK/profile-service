import { Module } from '@nestjs/common';
import { FilesModule } from './files/files.module';
import { AddressModule } from './address/address.module';

@Module({
  imports: [FilesModule, AddressModule],
  exports: [FilesModule, AddressModule],
})
export class SharedModule {}
