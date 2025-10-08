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

  async deleteOrganization(user: string) {}
}
