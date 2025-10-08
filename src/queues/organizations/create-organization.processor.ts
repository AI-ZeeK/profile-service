import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('create_organization')
export class CreateOrganizationProcessor extends WorkerHost {
  constructor(private readonly organizationService: OrganizationsService) {
    super();
  }

  async process(job: Job) {
    console.log('Creating organization for:', job.data.email);
    await this.organizationService.createOrganization(job.data);
  }
}
