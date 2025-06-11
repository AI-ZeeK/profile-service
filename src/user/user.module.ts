import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { SharedModule } from 'src/modules/shared.module';

@Module({
  imports: [SharedModule],
  providers: [UserService, JwtService],
  exports: [UserService],
})
export class UserModule {}
