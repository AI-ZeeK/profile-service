import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { StaffService } from './staff.service';
import {
  ManyStaffDetailsRequest,
  PROFILE_SERVICE_NAME,
  StaffDetailsRequest,
} from 'src/shared/dependencies/profile.pb';

@Controller()
export class StaffController {
  private logger = new Logger(StaffController.name);
  constructor(private readonly staffService: StaffService) {}

  @GrpcMethod(PROFILE_SERVICE_NAME, 'getStaffDetails')
  async getStaffDetails(data: StaffDetailsRequest) {
    const result = await this.staffService.getStaffDetails(data);
    this.logger.log('Returning roles:', result);
    return result;
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'getManyStaffDetails')
  async getManyStaffDetails(data: ManyStaffDetailsRequest) {
    const result = await this.staffService.getManyStaffDetails(data);
    this.logger.log('Returning roles:', result);
    return result;
  }
}
