import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RolesService } from './roles.service';
import { PROFILE_SERVICE_NAME } from 'src/shared/dependencies/profile.pb';

@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @GrpcMethod(PROFILE_SERVICE_NAME, 'getRoles')
  getRoles() {
    return this.rolesService.findMany();
  }
}
