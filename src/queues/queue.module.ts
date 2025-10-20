import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { OrganizationProcessor } from './organizations/organization.processor';
import { OrganizationsModule } from '../modules/organizations/organizations.module';
import { FinancialsModule } from 'src/modules/financials/financials.module';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';
import { BusinessUserProcessor } from './organizations/create-business-user.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'organization' },
      { name: 'business-user' },
      // Removed 'financials' queue - using RabbitMQ for external services
    ),
    OrganizationsModule,
    FinancialsModule,
    RabbitmqModule,
  ],
  providers: [
    OrganizationProcessor,
    BusinessUserProcessor,
    // Removed FinancialsProcessor - using RabbitMQ for external financials communication
  ],
  exports: [BullModule],
})
export class QueueModule {}
