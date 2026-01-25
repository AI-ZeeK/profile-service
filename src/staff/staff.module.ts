import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { CommunicationModule } from 'src/modules/communication/communication.module';
import { OrganizationsModule } from 'src/modules/organizations/organizations.module';

@Module({
  imports: [CommunicationModule, OrganizationsModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
