import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CommunicationService } from 'src/modules/communication/communication.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';
import { UserModule } from 'src/user/user.module';
import { SharedModule } from 'src/modules/shared.module';
import { AddressService } from 'src/modules/address/address.service';
import { FilesService } from 'src/modules/files/files.service';

@Module({
  imports: [forwardRef(() => UserModule), forwardRef(() => SharedModule)],
  controllers: [AuthController],
  providers: [AuthService, JwtService],
  exports: [AuthService, JwtService],
})
export class AuthModule {}
