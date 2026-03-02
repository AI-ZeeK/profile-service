import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FinancialsProcessor } from './financials.processor';
import { FinancialsService } from 'src/modules/financials/financials.service';
import { FINANCIALS_QUEUE_ENUM } from '../queue.enum';

@Module({
  imports: [
    BullModule.registerQueue({
      name: FINANCIALS_QUEUE_ENUM.BASE,
    }),
  ],
  providers: [FinancialsProcessor, FinancialsService],
  exports: [BullModule],
})
export class FinancialsQueueModule {}
