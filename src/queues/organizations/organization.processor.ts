import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { OrganizationsService } from 'src/modules/organizations/organizations.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('organization')
export class OrganizationProcessor {
  constructor(
    private readonly organizationService: OrganizationsService,
    private prisma: PrismaService,
    @InjectQueue('business-user') private businessUserQueue: Queue,
  ) {}

  @Process('create_organization')
  async handleCreateOrganization(job: Job) {
    try {
      const data = job.data;
      console.log('🧱 Creating organization for user:', data.creatorId);

      const organization = await this.organizationService.createOrganization({
        organizationName: data.organizationName || '',
        phoneNumber: data.phoneNumber || '',
        email: data.email || '',
        registrationNumber: data.registrationNumber || '',
        registrationDate: data.registrationDate || '',
        creatorId: data.creatorId,
      });

      if (organization.success) {
        console.log('✅ Organization created, queueing business user...');
        await this.businessUserQueue.add('create_business_user', {
          user_id: data.creatorId,
          organization_id: organization.organizationId,
          email: data.email,
        });
      } else {
        //   this.prisma.user.delete({
        //     where: { user_id: job.data.creatorId },
        //   })
        console.log('❌ Organization creation failed:', organization);
        throw new Error('Organization creation failed');
      }
    } catch (error) {
      this.prisma.user.delete({
        where: { user_id: job.data.creatorId },
      });
      console.error('Organization job failed:', error);
      throw error;
    }
  }
}
