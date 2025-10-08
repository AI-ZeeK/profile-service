import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';
import { OrganizationProcessor } from './organization.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'organization',
    }),
  ],
  providers: [OrganizationProcessor, OrganizationsService],
  exports: [BullModule],
})
export class OrganizationQueueModule {}
