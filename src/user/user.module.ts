import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { SharedModule } from 'src/modules/shared.module';
import { BusinessUserService } from './business-user.service';
import { SessionModule } from './session/session.module';

@Module({
  imports: [forwardRef(() => SharedModule), SessionModule],
  providers: [UserService, BusinessUserService, JwtService],
  exports: [UserService, BusinessUserService],
})
export class UserModule {}
