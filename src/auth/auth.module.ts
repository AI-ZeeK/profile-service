import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { SharedModule } from 'src/modules/shared.module';
import { BullModule } from '@nestjs/bullmq';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { COMMS_QUEUE_ENUM } from 'src/queues/queue.enum';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => SharedModule),
    forwardRef(() => RabbitmqModule),
    BullModule.registerQueue(
      {
        name: 'organization',
      },
      {
        name: COMMS_QUEUE_ENUM.BASE,
      },
    ),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService],
  exports: [AuthService, JwtService],
})
export class AuthModule {}
