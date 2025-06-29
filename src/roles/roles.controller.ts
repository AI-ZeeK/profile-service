import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RolesService } from './roles.service';
import {
  OrganizationRoleIdRequest,
  PROFILE_SERVICE_NAME,
} from 'src/shared/dependencies/profile.pb';

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

  @GrpcMethod(PROFILE_SERVICE_NAME, 'FetchOrganizationRoles')
  async fetchOrganizationRoles(data: OrganizationRoleIdRequest) {
    const result = await this.rolesService.findAllByOrganization(data);
    this.logger.log('Returning organization roles:', result);
    return result;
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'FetchOrganizationRolesCount')
  async fetchOrganizationRolesCount(data: OrganizationRoleIdRequest) {
    const result = await this.rolesService.findAllCountByOrganization(data);
    this.logger.log('Returning organization roles count:', result);
    return result;
  }
}
