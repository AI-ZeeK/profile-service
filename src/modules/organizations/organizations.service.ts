import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateOrganizationRequest,
  GetOrganizationRequest,
  ORGANIZATION_SERVICE_NAME,
  OrganizationServiceClient,
  protobufPackage,
  ValidateCompanyReferenceRequest,
  VerifyBranchIdRequest,
  VerifyCompanyIdRequest,
  VerifyDepartmentIdRequest,
} from 'src/shared/dependencies/organization.pb';

@Injectable()
export class OrganizationsService {
  private organizationService: OrganizationServiceClient;

  constructor(@Inject(protobufPackage) private client: ClientGrpc) {}

  onModuleInit() {
    this.organizationService =
      this.client.getService<OrganizationServiceClient>(
        ORGANIZATION_SERVICE_NAME,
      );
  }

  async createOrganization(data: CreateOrganizationRequest) {
    console.log('CREATE ORG SERVICE - Full Request:', JSON.stringify(data));
    return await firstValueFrom(
      this.organizationService.createOrganization(data),
    );
  }

  async validateCompanyReference(data: ValidateCompanyReferenceRequest) {
    return await firstValueFrom(
      this.organizationService.validateCompanyReference(data),
    );
  }

  async getOrganization(data: GetOrganizationRequest) {
    return await firstValueFrom(this.organizationService.getOrganization(data));
  }

  async verifyCompanyId(params: VerifyCompanyIdRequest) {
    return await firstValueFrom(
      this.organizationService.verifyCompanyId(params),
    );
  }

  async verifyBranchId(params: VerifyBranchIdRequest) {
    return await firstValueFrom(
      this.organizationService.verifyBranchId(params),
    );
  }

  async verifyDepartmentId(params: VerifyDepartmentIdRequest) {
    return await firstValueFrom(
      this.organizationService.verifyDepartmentId(params),
    );
  }

  async verifyRoleId(params: { companyId: string; roleId: string }) {
    return await firstValueFrom(
      this.organizationService.verifyRoleId({
        companyId: params.companyId,
        roleId: params.roleId,
      }),
    );
  }

  async getCompanyById(companyId: string) {
    const result = await firstValueFrom(
      this.organizationService.fetchCompany({ companyId }),
    );
    return result.company;
  }

  async deleteOrganization(user: string) {}
}
