import { forwardRef, Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { SharedModule } from 'src/modules/shared.module';
import { UserModule } from 'src/user/user.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    forwardRef(() => SharedModule),
    forwardRef(() => UserModule),
    BullModule.registerQueue({ name: 'business-user' }),
  ],

  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
