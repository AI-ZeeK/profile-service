import { forwardRef, Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { SharedModule } from 'src/modules/shared.module';
import { UserModule } from 'src/user/user.module';
import { BullModule } from '@nestjs/bullmq';
import {
  BUSINESS_USER_QUEUE_ENUM,
  COMMS_QUEUE_ENUM,
} from 'src/queues/queue.enum';

@Module({
  imports: [
    forwardRef(() => SharedModule),
    forwardRef(() => UserModule),
    BullModule.registerQueue({ name: BUSINESS_USER_QUEUE_ENUM.BASE }),
  ],

  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
