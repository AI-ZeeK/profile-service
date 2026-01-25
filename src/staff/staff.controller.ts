import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { StaffService } from './staff.service';
import {
  AcceptInvitationRequest,
  CompanyIdRequest,
  DeclineInvitationRequest,
  GetInvitationByCodeRequest,
  ManyStaffDetailsRequest,
  MarkInvitationViewedRequest,
  PaginatedCompanyRequest,
  PROFILE_SERVICE_NAME,
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
    this.logger.log('Returning staff details:', result);
    return result;
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'getManyStaffDetails')
  async getManyStaffDetails(data: ManyStaffDetailsRequest) {
    const result = await this.staffService.getManyStaffDetails(data);
    this.logger.log('Returning staff details:', result);
    return result;
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'getCompanyStaffs')
  async getCompanyStaffs(data: PaginatedCompanyRequest) {
    const result = await this.staffService.getCompanyStaffs(data);
    return result;
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'GetInvitationsByCompany')
  async getInvitationsByCompany(data: CompanyIdRequest) {
    this.logger.log('Getting invitations by company:', data.companyId);
    return await this.staffService.getInvitationsByCompany(data);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'SendStaffInvitations')
  async sendStaffInvitations(data: SendStaffInvitationsRequest) {
    this.logger.log('Sending staff invitations:', data);
    return await this.staffService.sendStaffInvitations(data);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'GetInvitationByCode')
  async getInvitationByCode(data: GetInvitationByCodeRequest) {
    this.logger.log('Getting invitation by code:', data.invitationCode);
    return await this.staffService.getInvitationByCode(data.invitationCode);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'MarkInvitationViewed')
  async markInvitationViewed(data: MarkInvitationViewedRequest) {
    this.logger.log('Marking invitation as viewed:', data.invitationCode);
    return await this.staffService.markInvitationViewed(data.invitationCode);
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'AcceptInvitation')
  async acceptStaffInvitation(data: AcceptInvitationRequest) {
    this.logger.log(
      'Accepting invitation:',
      data.invitationCode,
      'for user:',
      data.userId,
    );
    return await this.staffService.acceptInvitation(
      data.invitationCode,
      data.userId,
    );
  }

  @GrpcMethod(PROFILE_SERVICE_NAME, 'DeclineInvitation')
  async declineStaffInvitation(data: DeclineInvitationRequest) {
    this.logger.log('Declining invitation:', data.invitationCode);
    return await this.staffService.declineInvitation(data.invitationCode);
  }
}
