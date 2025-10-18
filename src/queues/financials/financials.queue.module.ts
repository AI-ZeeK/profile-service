import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FinancialsProcessor } from './financials.processor';
import { FinancialsService } from 'src/modules/financials/financials.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'financials',
    }),
  ],
  providers: [FinancialsProcessor, FinancialsService],
  exports: [BullModule],
})
export class FinancialsQueueModule {}
