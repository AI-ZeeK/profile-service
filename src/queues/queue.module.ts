import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { OrganizationProcessor } from './organizations/organization.processor';
import { BusinessUserProcessor } from './organizations/create-busines-user.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'organization' },
      { name: 'business-user' },
    ),
  ],
  providers: [OrganizationProcessor, BusinessUserProcessor],
  exports: [BullModule],
})
export class QueueModule {}
