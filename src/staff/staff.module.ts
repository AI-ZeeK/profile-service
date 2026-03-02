import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { CommunicationModule } from 'src/modules/communication/communication.module';
import { OrganizationsModule } from 'src/modules/organizations/organizations.module';
import { SharedModule } from 'src/modules/shared.module';

@Module({
  imports: [CommunicationModule, OrganizationsModule, SharedModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
