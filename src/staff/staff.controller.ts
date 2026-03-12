import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { StaffService } from './staff.service';
import {
  AcceptInvitationRequest,
  CompanyIdRequest,
  DeclineInvitationRequest,
  GetInvitationByCodeRequest,
  ManyStaffDetailsRequest,
  PaginatedCompanyRequest,
  PROFILE_SERVICE_NAME,
  ResendStaffInvitationRequest,
  SendStaffInvitationsRequest,
  StaffDetailsRequest,
} from 'src/shared/dependencies/profile.pb';

@Controller('staff')
export class StaffController {
  private logger = new Logger(StaffController.name);
  constructor(private readonly staffService: StaffService) {}

  @GrpcMethod(PROFILE_SERVICE_NAME, 'getStaffDetails')
  async getStaffDetails(data: StaffDetailsRequest) {
    const result = await this.staffService.getStaffDetails(data);
    return result;
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'getManyStaffDetails')
  async getManyStaffDetails(data: ManyStaffDetailsRequest) {
    const result = await this.staffService.getManyStaffDetails(data);

    return result;
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'getCompanyStaffs')
  async getCompanyStaffs(data: PaginatedCompanyRequest) {
    const result = await this.staffService.getCompanyStaffs(data);
    return result;
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'GetInvitationsByCompany')
  async getInvitationsByCompany(data: CompanyIdRequest) {
    return await this.staffService.getInvitationsByCompany(data);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'SendStaffInvitations')
  async sendStaffInvitations(data: SendStaffInvitationsRequest) {
    return await this.staffService.sendStaffInvitations(data);
  }
  @GrpcMethod(PROFILE_SERVICE_NAME, 'ResendStaffInvitation')
  async resendStaffInvitation(data: ResendStaffInvitationRequest) {
    return await this.staffService.resendStaffInvitation(data);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'GetInvitationByCode')
  async getInvitationByCode(data: GetInvitationByCodeRequest) {
    return await this.staffService.getInvitationByCode(data.invitationCode);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'DeleteStaffInvitation')
  async deleteStaffInvitation(data: GetInvitationByCodeRequest) {
    return await this.staffService.deleteStaffInvitation(data.invitationCode);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'AcceptInvitation')
  async acceptStaffInvitation(data: AcceptInvitationRequest) {
    return await this.staffService.acceptInvitation(data);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'DeclineInvitation')
  async declineStaffInvitation(data: DeclineInvitationRequest) {
    return await this.staffService.declineInvitation(data.invitationCode);
  }
}
