import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { SharedModule } from 'src/modules/shared.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => SharedModule),
    BullModule.registerQueue({
      name: 'organization',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService],
  exports: [AuthService, JwtService],
})
export class AuthModule {}
