import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { SharedModule } from 'src/modules/shared.module';
import { BusinessUserService } from './business-user.service';

@Module({
  imports: [forwardRef(() => SharedModule)],
  providers: [UserService, BusinessUserService, JwtService],
  exports: [UserService, BusinessUserService],
})
export class UserModule {}
