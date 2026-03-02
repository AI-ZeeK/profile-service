import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CommsProcessor } from './comms.processor';
import { COMMS_QUEUE_ENUM } from '../queue.enum';
import { SharedModule } from 'src/modules/shared.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: COMMS_QUEUE_ENUM.BASE,
    }),
    SharedModule,
  ],
  providers: [CommsProcessor],
  exports: [BullModule],
})
export class CommsQueueModule {}
