import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RolesService } from './roles.service';
import { PROFILE_SERVICE_NAME } from 'src/shared/dependencies/profile.pb';

@Controller()
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly rolesService: RolesService) {}

  @GrpcMethod(PROFILE_SERVICE_NAME, 'GetRoles')
  async getRoles() {
    const result = await this.rolesService.findMany();
    this.logger.log('Returning roles:', result);
    return result;
  }
}
